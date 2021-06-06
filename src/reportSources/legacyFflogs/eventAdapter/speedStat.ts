import {getActions} from 'data/ACTIONS'
import {getDataBy} from 'data/getDataBy'
import {JobKey} from 'data/JOBS'
import {getStatuses} from 'data/STATUSES'
import {Attribute, Event, Events, AttributeValue} from 'event'
import {FflogsEvent} from 'fflogs'
import _ from 'lodash'
import {Actor, Team} from 'report'
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

interface GCD {
	prepare?: Events['prepare']
	action?: Events['action']
	start: number
	actionId: number
}
function isInterrupted(gcd: GCD): boolean {
	return gcd.prepare != null && gcd.action == null
}
function isInstant(gcd: GCD): boolean {
	return gcd.action != null && gcd.prepare == null
}

export class SpeedStatsAdapterStep extends AdapterStep {
	private actorActions = new Map<Actor['id'], GCD[]>()
	private actorSpeedmodWindows = new Map<Actor['id'], Map<number, SpeedmodWindow[]>>()

	static debug = false
	private endTimestamp = 0

	adapt(baseEvent: FflogsEvent, adaptedEvents: Event[]) {
		if (baseEvent.type === 'encounterend') {
			this.endTimestamp = baseEvent.timestamp
		}

		return adaptedEvents
	}

	postprocess(adaptedEvents: Event[]): Event[] {
		adaptedEvents.forEach((event) => {
			if (!('source' in event) || !this.actorIsFriendly(event.source)) { return }

			switch (event.type) {
			case 'prepare':
			case 'action':
				this.trackGCD(event)
				break
			case 'statusApply':
				this.checkStatusApply(event)
				break
			case 'statusRemove':
				this.checkStatusRemove(event)
				break
			}
		})

		const eventsToAdd: Array<Events['actorUpdate']> = []
		this.actorActions.forEach((gcds, actorId) => {
			const speedStatUpdate = this.estimateActorSpeedStat(gcds, actorId)
			if (speedStatUpdate != null) { eventsToAdd.push(speedStatUpdate) }
		})

		return [...eventsToAdd, ...adaptedEvents]
	}

	private actorIsFriendly(actorId: string): boolean {
		const actor = this.pull.actors.find(a => a.id === actorId)
		return actor?.team === Team.FRIEND
	}

	private trackGCD(event: Events['prepare'] | Events['action']) {
		const action = getDataBy(getActions(this.report), 'id', event.action)
		if (!action?.onGcd) {
			return
		}

		let gcds = this.actorActions.get(event.source)
		if (gcds == null) {
			gcds = []
			this.actorActions.set(event.source, gcds)
		}

		if (event.type === 'action') {
			const lastInterval = gcds[gcds.length - 1]
			if (lastInterval != null && lastInterval.action == null && lastInterval.prepare != null && lastInterval.actionId === event.action) {
				lastInterval.action = event
				return
			}

			gcds.push({
				action: event,
				start: event.timestamp,
				actionId: event.action,
			})
		} else {
			gcds.push({
				prepare: event,
				start: event.timestamp,
				actionId: event.action,
			})
		}
	}

	private checkStatusApply(event: Events['statusApply']) {
		const status = getDataBy(getStatuses(this.report), 'id', event.status)
		if (status?.speedModifier == null) {
			return
		}

		let windows = this.actorSpeedmodWindows.get(event.target)
		if (windows == null) {
			windows = new Map<number, SpeedmodWindow[]>()
			this.actorSpeedmodWindows.set(event.target, windows)
		}
		let windowMap = windows.get(status.id)
		if (windowMap == null) {
			windowMap = new Array<SpeedmodWindow>()
			windows.set(status.id, windowMap)
		}
		windowMap.push({start: event.timestamp})
	}

	private checkStatusRemove(event: Events['statusRemove']) {
		const status = _.find(getStatuses(this.report), s => s.id === event.status)
		if (status?.speedModifier == null) {
			return
		}

		const windows = this.actorSpeedmodWindows.get(event.target)
		if (windows == null) {
			throw new Error('Received statusRemove event for an actor with no open speedmod windows')
		}
		const windowMap = windows.get(status.id)
		if (windowMap == null || windowMap[windowMap.length-1].end != null) {
			throw new Error('Received statusRemove event for a status with no open speedmod windows')
		}
		windowMap[windowMap.length-1].end = event.timestamp
	}

	private estimateActorSpeedStat(gcds: GCD[], actorId: string): Events['actorUpdate'] | undefined {
		const speedAttributeKeys = [Attribute.SKILL_SPEED, Attribute.SPELL_SPEED] as const
		const intervalGroups = {
			[Attribute.SKILL_SPEED]: new Map<number, number>(),
			[Attribute.SPELL_SPEED]: new Map<number, number>(),
		}

		gcds.forEach((gcd, index) => {
			const previous = gcds[index - 1]
			// Skip the first iteration (no interval to compare), and skip any intervals where the user interrputed a cast since that didn't trigger a full gcd
			if (previous == null || isInterrupted(previous)) { return }

			const previousAction = _.find(getActions(this.report), a => a.id === previous.actionId)
			// Skip intervals where the leading skill's gcdRecast isn't modified by a speed stat
			if (previousAction == null || !(previousAction.speedAttribute === Attribute.SKILL_SPEED || previousAction.speedAttribute === Attribute.SPELL_SPEED)) { return }

			const rawInterval = gcd.start - previous.start
			let hasAnimationLock = false
			let recast = previousAction.gcdRecast ?? previousAction.cooldown ?? BASE_GCD

			if (!isInstant(previous)) {
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

			const count = intervalGroups[previousAction.speedAttribute].get(interval) ?? 0
			intervalGroups[previousAction.speedAttribute].set(interval, count + 1)
		})

		const attributes: AttributeValue[] = []
		for (const attribute of speedAttributeKeys) {
			const group = intervalGroups[attribute]
			if (group.size > 0) {
				this.debug(`Actor ID: ${actorId} - ${attribute.toString} Event Intervals ${JSON.stringify(Array.from(group.entries()).sort((a, b) => b[1] - a[1]))}`)
				attributes.push({
					attribute: attribute,
					value: getSpeedStat(this.getMostFrequentInterval(group)),
					estimated: true,
				})
			}
		}

		if (attributes.length > 0) {
			return {
				type: 'actorUpdate',
				actor: actorId,
				timestamp: this.pull.timestamp + PREPULL_OFFSETS.ATTRIBUTE_UPDATE,
				attributes,
			}
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
