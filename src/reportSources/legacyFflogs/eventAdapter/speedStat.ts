import {getActions} from 'data/ACTIONS'
import {getDataBy} from 'data/getDataBy'
import {JobKey} from 'data/JOBS'
import {getStatuses} from 'data/STATUSES'
import {Attribute, Event, Events, AttributeValue} from 'event'
import {BuffEvent, CastEvent, FflogsEvent} from 'fflogs'
import _ from 'lodash'
import {Actor, Team} from 'report'
import {resolveActorId} from 'reportSources/legacyFflogs/base'
import {getSpeedStat} from 'utilities/speedStatMapper'
import {AdapterStep, PREPULL_OFFSETS} from './base'

const BASE_GCD = 2500
const ANIMATION_LOCK = 100
const JOB_SPEED_MODIFIERS: Partial<Record<JobKey, number>> = {
	MONK: 0.8,
	NINJA: 0.85,
}
interface SpeedmodWindow {
	start: number,
	end?: number,
}

class GCD {
	prepare: CastEvent | undefined
	action: CastEvent | undefined

	get isInterrupted(): boolean { return this.prepare != null && this.action == null }
	get isInstant(): boolean { return this.action != null && this.prepare == null }

	get start(): number {
		if (this.prepare != null) { return this.prepare.timestamp }
		if (this.action != null) { return this.action.timestamp } // Instant cast action - no prepare event
		throw new Error('Unexpected GCD with no prepare or action event')
	}

	get actionId(): number {
		if (this.prepare != null) { return this.prepare.ability.guid }
		if (this.action != null) { return this.action.ability.guid }
		throw new Error('Unexpected GCD with no prepare or action event')
	}
}

export class SpeedStatsAdapterStep extends AdapterStep {
	private actorActions = new Map<Actor['id'], GCD[]>()
	private actorSpeedmodWindows = new Map<Actor['id'], Map<number, SpeedmodWindow[]>>()

	static debug = false
	private endTimestamp = 0

	adapt(baseEvent: FflogsEvent, adaptedEvents: Event[]) {
		const actorId = resolveActorId({id: baseEvent.sourceID, instance: baseEvent.sourceInstance, actor: baseEvent.source})
		if (this.actorIsFriendly(actorId)) {
			switch (baseEvent.type) {
			case 'begincast':
			case 'cast':
				this.trackGCD(baseEvent, actorId)
				break
			case 'applybuff':
				this.checkStatusApply(baseEvent, actorId)
				break
			case 'removebuff':
				this.checkStatusRemove(baseEvent, actorId)
				break
			case 'encounterend':
				this.endTimestamp = baseEvent.timestamp
				break
			}
		}

		return adaptedEvents
	}

	postprocess(adaptedEvents: Event[]): Event[] {
		const eventsToAdd: Array<Events['actorUpdate']> = []
		this.actorActions.forEach((gcds, actorId) => eventsToAdd.push(this.estimateActorSpeedStat(gcds, actorId)))

		return [...eventsToAdd, ...adaptedEvents]
	}

	private trackGCD(event: CastEvent, actorId: string) {
		const action = getDataBy(getActions(this.report), 'id', event.ability.guid)
		if (!action?.onGcd) {
			return
		}

		let gcds = this.actorActions.get(actorId)
		if (gcds == null) {
			gcds = []
			this.actorActions.set(actorId, gcds)
		}

		if (event.type === 'cast') {
			const lastInterval = gcds[gcds.length - 1]
			if (lastInterval != null && lastInterval.action == null && lastInterval.prepare != null && lastInterval.prepare.ability.guid === event.ability.guid) {
				lastInterval.action = event
				return
			}

			const gcd = new GCD()
			gcd.action = event
			gcds.push(gcd)
		} else {
			const gcd = new GCD()
			gcd.prepare = event
			gcds.push(gcd)
		}
	}

	private checkStatusApply(event: BuffEvent, actorId: string) {
		const status = getDataBy(getStatuses(this.report), 'id', event.ability.guid)
		if (status?.speedModifier == null) {
			return
		}

		let windows = this.actorSpeedmodWindows.get(actorId)
		if (windows == null) {
			windows = new Map<number, SpeedmodWindow[]>()
			this.actorSpeedmodWindows.set(actorId, windows)
		}
		let windowMap = windows.get(status.id)
		if (windowMap == null) {
			windowMap = new Array<SpeedmodWindow>()
			windows.set(status.id, windowMap)
		}
		windowMap.push({start: event.timestamp})
	}

	private checkStatusRemove(event: BuffEvent, actorId: string) {
		const status = _.find(getStatuses(this.report), s => s.id === event.ability.guid)
		if (status?.speedModifier == null) {
			return
		}

		const windows = this.actorSpeedmodWindows.get(actorId)
		if (windows == null) {
			throw new Error('Received statusRemove event for an actor with no open speedmod windows')
		}
		const windowMap = windows.get(status.id)
		if (windowMap == null || windowMap[windowMap.length-1].end != null) {
			throw new Error('Received statusRemove event for a status with no open speedmod windows')
		}
		windowMap[windowMap.length-1].end = event.timestamp
	}

	private actorIsFriendly(actorId: string): boolean {
		const actor = this.pull.actors.find(a => a.id === actorId)
		return actor?.team === Team.FRIEND
	}

	private estimateActorSpeedStat(gcds: GCD[], actorId: string): Events['actorUpdate'] {
		const skillSpeedIntervalGroups = new Map<number, number>()
		const spellSpeedIntervalGroups = new Map<number, number>()

		gcds.forEach((gcd, index) => {
			const previous = gcds[index - 1]
			// Skip the first iteration (no interval to compare), and skip any intervals where the user interrputed a cast since that didn't trigger a full gcd
			if (previous == null || previous.isInterrupted) { return }

			const previousAction = _.find(getActions(this.report), a => a.id === previous.actionId)
			// Skip intervals where the leading skill's gcdRecast isn't modified by a speed stat
			if (previousAction == null || previousAction.speedAttribute == null) { return }

			const rawInterval = gcd.start - previous.start
			let hasAnimationLock = false
			let recast = previousAction.gcdRecast ?? previousAction.cooldown ?? BASE_GCD

			if (!previous.isInstant) {
				if (previousAction.castTime != null && previousAction.castTime >= BASE_GCD) {
					hasAnimationLock = true
					recast = previousAction.castTime
				}
			}

			const castTimeScale = recast / BASE_GCD
			const speedModifier = this.getSpeedModifierAtTimestamp(previous.start, actorId)
			const interval = _.round((rawInterval - (hasAnimationLock ? ANIMATION_LOCK : 0)) / castTimeScale / speedModifier, 2)

			// The below debug is useful if you need to trace individual interval calculations, but will make your console really laggy if you enable it without any filter
			//this.debug(`Actor ID: ${actorId} - Event at ${previous.start} - Raw Interval: ${rawIntervalSeconds}s - Caster Tax: ${isCasterTaxed} - Cast Time Scale: ${castTimeScale} - Speed Modifier: ${speedModifier} - Calculated Interval: ${intervalSeconds}s`)

			if (previousAction.speedAttribute === Attribute.SKILL_SPEED) {
				const count = skillSpeedIntervalGroups.get(interval) ?? 0
				skillSpeedIntervalGroups.set(interval, count + 1)
			} else if (previousAction.speedAttribute === Attribute.SPELL_SPEED) {
				const count = spellSpeedIntervalGroups.get(interval) ?? 0
				spellSpeedIntervalGroups.set(interval, count + 1)
			}
		})

		const attributes: AttributeValue[] = []
		if (skillSpeedIntervalGroups.size > 0) {
			this.debug(`Actor ID: ${actorId} - Skill Speed Event Intervals ${JSON.stringify(Array.from(skillSpeedIntervalGroups.entries()).sort((a, b) => b[1] - a[1]))}`)
			attributes.push({
				attribute: Attribute.SKILL_SPEED,
				value: getSpeedStat(this.getMostFrequentInterval(skillSpeedIntervalGroups)),
				estimated: true,
			})
		}

		if (spellSpeedIntervalGroups.size > 0) {
			this.debug(`Actor ID: ${actorId} - Spell Speed Event Intervals ${JSON.stringify(Array.from(spellSpeedIntervalGroups.entries()).sort((a, b) => b[1] - a[1]))}`)
			attributes.push({
				attribute: Attribute.SPELL_SPEED,
				value: getSpeedStat(this.getMostFrequentInterval(spellSpeedIntervalGroups)),
				estimated: true,
			})
		}

		return {
			type: 'actorUpdate',
			actor: actorId,
			timestamp: this.pull.timestamp + PREPULL_OFFSETS.ATTRIBUTE_UPDATE,
			attributes,
		}
	}

	private getSpeedModifierAtTimestamp(timestamp: number, actorId: string) {
		const actorWindows = this.actorSpeedmodWindows.get(actorId)
		let speedModifier = 1

		const actor = this.pull.actors.find(a => a.id === actorId)
		if (actor != null) {
			speedModifier *= JOB_SPEED_MODIFIERS[actor.job] ?? 1
		}

		if (actorWindows == null) {
			return speedModifier
		}

		actorWindows.forEach((windows, statusId) => {
			if (windows.some(w => w.start < timestamp && timestamp <= (w.end ?? this.endTimestamp))) {
				const status = _.find(getStatuses(this.report), s => s.id === statusId)
				if (status != null && status.speedModifier != null) {
					speedModifier *= status.speedModifier
				}
			}
		})

		return speedModifier
	}

	private getMostFrequentInterval(intervalGroups: Map<number,  number>) : number {
		return Array.from(intervalGroups.entries()).reduce((a, b) => b[1] > a[1] ? b : a)[0]
	}
}
