//I've heard it's cool to build your own job gauge.
import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import Color from 'color'
import {ActionLink} from 'components/ui/DbLink'
import JOBS from 'data/JOBS'
import {Cause, Event, Events, FieldsBase} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {TimestampHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import BrokenLog from 'parser/core/modules/BrokenLog'
import CastTime from 'parser/core/modules/CastTime'
import {Data} from 'parser/core/modules/Data'
import {ResourceDatum, ResourceGraphs} from 'parser/core/modules/ResourceGraphs'
import Suggestions, {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {UnableToAct} from 'parser/core/modules/UnableToAct'
import {CompleteEvent} from 'parser/core/Parser'
import React from 'react'
import {isSuccessfulHit} from 'utilities'
import {FIRE_SPELLS, ICE_SPELLS_TARGETED, ICE_SPELLS_UNTARGETED} from './Elements'

const ENOCHIAN_DURATION_REQUIRED = 30000
export const ASTRAL_UMBRAL_DURATION = 15000
export const MAX_ASTRAL_UMBRAL_STACKS = 3
export const MAX_UMBRAL_HEART_STACKS = 3
const MAX_ASTRAL_UMBRAL_CAST_SCALAR = 0.5
const FLARE_MAX_HEART_CONSUMPTION = 3
const MAX_POLYGLOT_STACKS = 2

interface EventBLMGauge extends FieldsBase {
	type: 'blmgauge',
}

export interface BLMGaugeState {
	astralFire: number,
	umbralIce: number,
	umbralHearts: number,
	polyglot: number,
	enochian: boolean,
}

declare module 'event' {
	interface EventTypeRepository {
		blmgauge: EventBLMGauge
	}
}

interface EnochianDowntimeWindow {
	start: number,
	stop?: number,
}

interface EnochianDowntimeTracking {
	current?: EnochianDowntimeWindow,
	history: EnochianDowntimeWindow[],
	totalDowntime: number
}

export default class Gauge extends Analyser {
	static override handle = 'gauge'
	static override title = t('blm.gauge.title')`Gauge`

	@dependency private suggestions!: Suggestions
	@dependency private brokenLog!: BrokenLog
	@dependency private unableToAct!: UnableToAct
	@dependency private data!: Data
	@dependency private resourceGraphs!: ResourceGraphs
	@dependency private castTime!: CastTime

	private enochianDowntimeTracker: EnochianDowntimeTracking = {
		history: [],
		totalDowntime: 0,
	}

	private droppedEnoTimestamps: number[] = []
	private lostPolyglot: number = 0
	private overwrittenPolyglot: number = 0

	private gaugeHistory: Map<number, BLMGaugeState> = new Map<number, BLMGaugeState>()
	private lastHistoryTimestamp!: number
	private currentGaugeState: BLMGaugeState = {
		astralFire: 0,
		umbralIce: 0,
		umbralHearts: 0,
		polyglot: 0,
		enochian: false,
	}
	private polyglotHistory: ResourceDatum[] = []
	private astralFireHistory: ResourceDatum[] = []
	private umbralIceHistory: ResourceDatum[] = []
	private umbralHeartHistory: ResourceDatum[] = []

	private astralUmbralTimeoutHook!: TimestampHook | null
	private gainPolyglotHook!: TimestampHook | null

	private fireSpellIds = FIRE_SPELLS.map(key => this.data.actions[key].id)
	private targetedIceSpellIds = ICE_SPELLS_TARGETED.map(key => this.data.actions[key].id)
	private untargetedIceSpellIds = ICE_SPELLS_UNTARGETED.map(key => this.data.actions[key].id)
	private iceSpellIds = [
		...this.targetedIceSpellIds,
		...this.untargetedIceSpellIds,
	]

	private affectsGaugeOnDamage: number[] = [
		...this.fireSpellIds,
		...this.targetedIceSpellIds,
	]
	private affectsGaugeOnCast: number[] = [
		...this.untargetedIceSpellIds,
		this.data.actions.TRANSPOSE.id,
		this.data.actions.ENOCHIAN.id,
		this.data.actions.FOUL.id,
		this.data.actions.XENOGLOSSY.id,
	]

	private castTimeIndex: number | null = null

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)

		// The action event is sufficient for actions that don't need to do damage to affect gauge state (ie. Transpose, Enochian, Umbral Soul)
		// Foul and Xenoglossy also fall into this category since they consume Polyglot on execution
		this.addEventHook(playerFilter.type('action').action(oneOf(this.affectsGaugeOnCast)), this.onCast)

		// The rest of the fire and ice spells must do damage in order to affect gauge state, so hook that event instead.
		this.addEventHook(playerFilter.type('damage').cause(filter<Cause>().action(oneOf(this.affectsGaugeOnDamage))), this.onCast)

		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onDeath)
		this.addEventHook('complete', this.onComplete)

		this.setGaugeAndUpdateHistory(this.parser.pull.timestamp)
	}

	/**
	 * Retrieves the gauge state at the specified epoch timestamp
	 * @param timestamp The epoch timestamp to get the gauge state at, defaults to parser.currentEpochTimestamp
	 * @returns The BLMGaugeState object for this timestamp, or undefined if not found
	*/
	public getGaugeState(timestamp: number = this.parser.currentEpochTimestamp): BLMGaugeState | undefined {
		// First try to get the gauge state at this exact timestamp
		let gaugeState = this.gaugeHistory.get(timestamp)
		// If there is no gauge state for the exact timestamp, look through the historical data to find the effective state
		if (gaugeState == null) {
			let historyKey = 0
			// If anyone knows of a better way to get the last historical timestamp prior to the parameter timestamp, please tell me...
			for (const key of this.gaugeHistory.keys()) {
				if (key > timestamp) { break }
				historyKey = key
			}
			gaugeState = this.gaugeHistory.get(historyKey)
		}
		return gaugeState
	}

	//#region onCast and gauge state modification
	private onCast(event: Events['damage'] | Events['action']) {
		let abilityId
		if ('cause' in event && 'action' in event.cause) {
			abilityId = event.cause.action
		} else if ('action' in event) {
			abilityId = event.action
		}

		// If we couldn't figure out what ability this is (somehow wound up here because of a DoT?), bail
		if (abilityId == null) { return }

		// Bail out if the event didn't do damage and the action needs to in order to affect gauge state
		if (this.affectsGaugeOnDamage.includes(abilityId) && event.type === 'damage' && !isSuccessfulHit(event)) { return }

		switch (abilityId) {
		case this.data.actions.ENOCHIAN.id:
			if (!this.currentGaugeState.astralFire && !this.currentGaugeState.umbralIce) {
				this.brokenLog.trigger(this, 'no stack eno', (
					<Trans id="blm.gauge.trigger.no-stack-eno">
						<ActionLink {...this.data.actions.ENOCHIAN}/> was cast without any Astral Fire or Umbral Ice stacks detected.
					</Trans>
				))
			}
			if (!this.currentGaugeState.enochian) {
				this.startEnochianUptime(event.timestamp)
				this.addEvent()
			}
			break
		case this.data.actions.BLIZZARD_I.id:
		case this.data.actions.BLIZZARD_II.id:
		case this.data.actions.FREEZE.id:
			this.onGainUmbralIceStacks(MAX_ASTRAL_UMBRAL_STACKS, false)
			this.tryGainUmbralHearts(1)
			break
		case this.data.actions.BLIZZARD_III.id:
			this.onGainUmbralIceStacks(MAX_ASTRAL_UMBRAL_STACKS, false)
			break
		case this.data.actions.BLIZZARD_IV.id:
			if (!this.currentGaugeState.enochian) {
				this.brokenLog.trigger(this, 'no eno b4', (
					<Trans id="blm.gauge.trigger.no-eno-b4">
						<ActionLink {...this.data.actions.BLIZZARD_IV}/> was cast while <ActionLink {...this.data.actions.ENOCHIAN}/> was deemed inactive.
					</Trans>
				))
				this.startEnochianUptime(event.timestamp)
			}
			this.currentGaugeState.umbralHearts = MAX_UMBRAL_HEART_STACKS
			this.addEvent()
			break
		case this.data.actions.UMBRAL_SOUL.id:
			this.onGainUmbralIceStacks(1)
			this.tryGainUmbralHearts(1)
			break
		case this.data.actions.FIRE_I.id:
		case this.data.actions.FIRE_II.id:
			this.tryConsumeUmbralHearts(1)
			this.onGainAstralFireStacks(1)
			break
		case this.data.actions.FIRE_III.id:
			this.tryConsumeUmbralHearts(1)
			this.onGainAstralFireStacks(MAX_ASTRAL_UMBRAL_STACKS, false)
			break
		case this.data.actions.FIRE_IV.id:
			if (!this.currentGaugeState.enochian) {
				this.brokenLog.trigger(this, 'no eno f4', (
					<Trans id="blm.gauge.trigger.no-eno-f4">
						<ActionLink {...this.data.actions.FIRE_IV}/> was cast while <ActionLink {...this.data.actions.ENOCHIAN}/> was deemed inactive.
					</Trans>
				))
				this.startEnochianUptime(event.timestamp)
			}
			this.tryConsumeUmbralHearts(1)
			break
		case this.data.actions.DESPAIR.id:
			if (!this.currentGaugeState.enochian) {
				this.brokenLog.trigger(this, 'no eno despair', (
					<Trans id="blm.gauge.trigger.no-eno-despair">
						<ActionLink {...this.data.actions.DESPAIR}/> was cast while <ActionLink {...this.data.actions.ENOCHIAN}/> was deemed inactive.
					</Trans>
				))
				this.startEnochianUptime(event.timestamp)
			}
			this.onGainAstralFireStacks(MAX_ASTRAL_UMBRAL_STACKS, false)
			break
		case this.data.actions.FLARE.id:
			this.tryConsumeUmbralHearts(FLARE_MAX_HEART_CONSUMPTION, true)
			this.onGainAstralFireStacks(MAX_ASTRAL_UMBRAL_STACKS, false)
			break
		case this.data.actions.XENOGLOSSY.id:
		case this.data.actions.FOUL.id:
			this.onConsumePolyglot()
			break
		case this.data.actions.TRANSPOSE.id:
			this.onTransposeStacks()
			break
		}
	}

	private addEvent() {
		if (this.currentGaugeState.astralFire > 0 || this.currentGaugeState.umbralIce > 0) {
			if (this.astralUmbralTimeoutHook == null) {
				this.astralUmbralTimeoutHook = this.addTimestampHook(this.parser.currentEpochTimestamp + ASTRAL_UMBRAL_DURATION, () => this.onAstralUmbralTimeout())
			}
			if (this.gainPolyglotHook == null && this.currentGaugeState.enochian) {
				this.gainPolyglotHook = this.addTimestampHook(this.parser.currentEpochTimestamp + ENOCHIAN_DURATION_REQUIRED, this.onGainPolyglot)
			}
		}

		const lastGaugeState = this.gaugeHistory.get(this.lastHistoryTimestamp)
		if (this.gaugeValuesChanged(lastGaugeState)) {
			this.updateCastTimes(lastGaugeState)
			this.setGaugeAndUpdateHistory()

			// Queue event to tell other analysers (and modules) about the change
			this.parser.queueEvent({
				type: 'blmgauge',
				timestamp: this.parser.currentEpochTimestamp,
			})
		}
	}

	private updateCastTimes(lastGaugeState?: BLMGaugeState): void {
		const lastAstralFire = lastGaugeState?.astralFire || 0
		const lastUmbralIce = lastGaugeState?.umbralIce || 0

		// If we have gained max AF, set Blizzard spells to be fast
		if (lastAstralFire !== MAX_ASTRAL_UMBRAL_STACKS && this.currentGaugeState.astralFire === MAX_ASTRAL_UMBRAL_STACKS) {
			this.castTime.reset(this.castTimeIndex)
			this.castTimeIndex = this.castTime.setPercentageAdjustment(this.iceSpellIds, MAX_ASTRAL_UMBRAL_CAST_SCALAR)
		}
		// If we have gained max UI, set Fire spells to be fast
		if (lastUmbralIce !== MAX_ASTRAL_UMBRAL_STACKS && this.currentGaugeState.umbralIce === MAX_ASTRAL_UMBRAL_STACKS) {
			this.castTime.reset(this.castTimeIndex)
			this.castTimeIndex = this.castTime.setPercentageAdjustment(this.fireSpellIds, MAX_ASTRAL_UMBRAL_CAST_SCALAR)
		}
		// If our current gauge state doesn't have either max AF or max UI, drop the cast time adjustment entirely
		if (this.currentGaugeState.astralFire !== MAX_ASTRAL_UMBRAL_STACKS && this.currentGaugeState.umbralIce !== MAX_ASTRAL_UMBRAL_STACKS) {
			this.castTime.reset(this.castTimeIndex)
			this.castTimeIndex = null
		}
	}

	private gaugeValuesChanged(lastGaugeEvent?: BLMGaugeState) {
		if (lastGaugeEvent == null) {
			return true
		}
		if (lastGaugeEvent.astralFire !== this.currentGaugeState.astralFire ||
			lastGaugeEvent.umbralIce !== this.currentGaugeState.umbralIce ||
			lastGaugeEvent.umbralHearts !== this.currentGaugeState.umbralHearts ||
			lastGaugeEvent.enochian !== this.currentGaugeState.enochian ||
			lastGaugeEvent.polyglot !== this.currentGaugeState.polyglot
		) {
			return true
		}
		return false
	}

	private setGaugeAndUpdateHistory(timestamp: number = this.parser.currentEpochTimestamp) {
		// Update the gauge history
		this.gaugeHistory.set(timestamp, {...this.currentGaugeState})

		// Store resource data and update the last history timestamp
		this.polyglotHistory.push({time: timestamp, current: this.currentGaugeState.polyglot, maximum: MAX_POLYGLOT_STACKS})
		this.astralFireHistory.push({time: timestamp, current: this.currentGaugeState.astralFire, maximum: MAX_ASTRAL_UMBRAL_STACKS})
		this.umbralIceHistory.push({time: timestamp, current: this.currentGaugeState.umbralIce, maximum: MAX_ASTRAL_UMBRAL_STACKS})
		this.umbralHeartHistory.push({time: timestamp, current: this.currentGaugeState.umbralHearts, maximum: MAX_UMBRAL_HEART_STACKS})

		this.lastHistoryTimestamp = timestamp
	}
	//#endregion

	//#region Astral Fire and Umbral Ice
	private onAstralUmbralTimeout(flagIssues: boolean = true) {
		this.astralUmbralTimeoutHook = this.tryExpireTimestampHook(this.astralUmbralTimeoutHook)

		this.currentGaugeState.astralFire = 0
		this.currentGaugeState.umbralIce = 0

		this.onEnochianTimeout(flagIssues)
	}

	private onGainAstralFireStacks(stackCount: number, dropsElementOnSwap: boolean = true) {
		if (this.currentGaugeState.umbralIce > 0 && dropsElementOnSwap) {
			this.onAstralUmbralTimeout()
		} else {
			this.astralUmbralTimeoutHook = this.tryExpireTimestampHook(this.astralUmbralTimeoutHook)

			this.currentGaugeState.umbralIce = 0
			this.currentGaugeState.astralFire = Math.min(this.currentGaugeState.astralFire + stackCount, MAX_ASTRAL_UMBRAL_STACKS)

			this.addEvent()
		}
	}

	private onGainUmbralIceStacks(stackCount: number, dropsElementOnSwap: boolean = true) {
		if (this.currentGaugeState.astralFire > 0 && dropsElementOnSwap) {
			this.onAstralUmbralTimeout()
		} else {
			this.astralUmbralTimeoutHook = this.tryExpireTimestampHook(this.astralUmbralTimeoutHook)

			this.currentGaugeState.astralFire = 0
			this.currentGaugeState.umbralIce = Math.min(this.currentGaugeState.umbralIce + stackCount, MAX_ASTRAL_UMBRAL_STACKS)

			this.addEvent()
		}
	}

	private onTransposeStacks() {
		if (this.currentGaugeState.astralFire <= 0 && this.currentGaugeState.umbralIce <= 0) { return }

		this.astralUmbralTimeoutHook = this.tryExpireTimestampHook(this.astralUmbralTimeoutHook)

		if (this.currentGaugeState.astralFire > 0) {
			this.currentGaugeState.astralFire = 0
			this.currentGaugeState.umbralIce = 1
		} else {
			this.currentGaugeState.astralFire = 1
			this.currentGaugeState.umbralIce = 0
		}

		this.addEvent()
	}
	//#endregion

	//#region Umbral Hearts
	private tryGainUmbralHearts(count: number) {
		if (this.currentGaugeState.umbralIce <= 0) { return }

		this.currentGaugeState.umbralHearts = Math.min(this.currentGaugeState.umbralHearts + count, MAX_UMBRAL_HEART_STACKS)

		this.addEvent()
	}

	private tryConsumeUmbralHearts(count:  number, force: boolean = false) {
		if (!(this.currentGaugeState.umbralHearts > 0 && (this.currentGaugeState.astralFire > 0 || force))) { return }

		this.currentGaugeState.umbralHearts = Math.max(this.currentGaugeState.umbralHearts - count, 0)
		this.addEvent()
	}
	//#endregion

	//#region Polyglot
	private onEnochianTimeout(flagIssues: boolean = true) {
		this.gainPolyglotHook = this.tryExpireTimestampHook(this.gainPolyglotHook)

		if (this.currentGaugeState.enochian && flagIssues) {
			this.enochianDowntimeTracker.current = {start: this.parser.currentEpochTimestamp}
			this.droppedEnoTimestamps.push(this.parser.currentEpochTimestamp)
		}

		this.currentGaugeState.enochian = false
		this.currentGaugeState.umbralHearts = 0

		this.addEvent()
	}

	private onGainPolyglot() {
		this.gainPolyglotHook = this.tryExpireTimestampHook(this.gainPolyglotHook)

		this.currentGaugeState.polyglot++
		if (this.currentGaugeState.polyglot > MAX_POLYGLOT_STACKS) {
			this.overwrittenPolyglot++
		}
		this.currentGaugeState.polyglot = Math.min(this.currentGaugeState.polyglot, MAX_POLYGLOT_STACKS)

		this.addEvent()
	}

	private onConsumePolyglot() {
		if (this.currentGaugeState.polyglot <= 0 && this.overwrittenPolyglot > 0) {
			// Safety to catch ordering issues where Foul is used late enough to trigger our overwrite check but happens before Poly actually overwrites
			this.overwrittenPolyglot--
		}
		this.currentGaugeState.polyglot = Math.max(this.currentGaugeState.polyglot - 1, 0)
		this.addEvent()
	}

	private startEnochianUptime(timestamp: number) {
		this.currentGaugeState.enochian = true

		if (this.enochianDowntimeTracker.current != null) {
			this.stopEnochianDowntime(timestamp)
		}
	}

	private stopEnochianDowntime(timestamp: number) {
		if (this.enochianDowntimeTracker.current == null) { return }

		this.enochianDowntimeTracker.current.stop = timestamp
		this.enochianDowntimeTracker.totalDowntime += Math.max(this.enochianDowntimeTracker.current.stop - this.enochianDowntimeTracker.current.start, 0)
		this.enochianDowntimeTracker.history.push({...this.enochianDowntimeTracker.current})
		//reset the timer again to prevent weirdness/errors
		this.enochianDowntimeTracker.current = undefined
	}

	// Refund unable-to-act time if the downtime window was longer than the AF/UI timer
	private countLostPolyglots(time: number) {
		let refundTime = 0
		this.enochianDowntimeTracker.history.forEach(downtime => {
			if (this.unableToAct.getWindows({
				start: downtime.start,
				end: downtime.start,
			}).filter((uta) => Math.max(0, uta.end - uta.start) >= ASTRAL_UMBRAL_DURATION).length > 0) {
				const endOfDowntime = downtime.stop || (this.parser.pull.timestamp + this.parser.pull.duration)
				refundTime += endOfDowntime - downtime.start // If the end of this enochian downtime occurred during an unableToAct time frame that lasted longer than the AF/UI timeout, refund that downtime
			}
		})
		return Math.floor(Math.max(0, time - refundTime)/ENOCHIAN_DURATION_REQUIRED)
	}
	//#endregion

	private tryExpireTimestampHook(hook: TimestampHook | null): TimestampHook | null {
		if (hook != null) {
			this.removeTimestampHook(hook)
			hook = null
		}
		return hook
	}

	private onDeath() {
		// Not counting the loss towards the rest of the gauge loss, that'll just double up on the suggestions
		this.onAstralUmbralTimeout(false)
	}

	private onComplete(event: CompleteEvent) {
		if (this.enochianDowntimeTracker.current) {
			this.stopEnochianDowntime(event.timestamp)
		}

		this.resourceGraphs.addDataGroup({
			handle: 'astralumbral',
			label: <Trans id="blm.gauge.resource.astral-umbral">Astral Fire and<br></br>Umbral Ice</Trans>,
			collapse: true,
			forceCollapsed: true,
		})
		this.resourceGraphs.addData('astralumbral', {
			label: <Trans id="blm.gauge.resource.astral-fire">Astral Fire</Trans>,
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			colour: Color.rgb(210, 62, 38).fade(0.5).toString(),
			data: this.astralFireHistory,
		})
		this.resourceGraphs.addData('astralumbral', {
			label: <Trans id="blm.gauge.resource.umbral-ice">Umbral Ice</Trans>,
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			colour: Color.rgb(47, 113, 177).fade(0.5).toString(),
			data: this.umbralIceHistory,
		})
		this.resourceGraphs.addGauge({
			label: <Trans id="blm.gauge.resource.umbral-hearts">Umbral Hearts</Trans>,
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			colour: Color.rgb(47, 113, 177).fade(0.25).toString(),
			data: this.umbralHeartHistory,
		})
		this.resourceGraphs.addGauge({
			label: <Trans id="blm.gauge.resource.polyglot">Polyglot</Trans>,
			// eslint-disable-next-line @typescript-eslint/no-magic-numbers
			colour: Color(JOBS.BLACK_MAGE.colour).fade(0.25).toString(),
			data: this.polyglotHistory,
		})
		this.lostPolyglot = this.countLostPolyglots(this.enochianDowntimeTracker.totalDowntime)

		// Find out how many of the enochian drops ocurred during times where the player could not act for longer than the AF/UI buff timer. If they could act, they could've kept it going, so warn about those.
		const droppedEno = this.droppedEnoTimestamps.filter(drop =>
			this.unableToAct
				.getWindows({
					start: drop,
					end: drop,
				})
				.filter((downtime) => Math.max(0, downtime.end - downtime.start) >= ASTRAL_UMBRAL_DURATION)
				.length === 0
		).length
		if (droppedEno) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.ENOCHIAN.icon,
				content: <Trans id="blm.gauge.suggestions.dropped-enochian.content">
					Dropping <ActionLink {...this.data.actions.ENOCHIAN}/> may lead to lost <ActionLink {...this.data.actions.XENOGLOSSY}/> or <ActionLink {...this.data.actions.FOUL}/> casts, more clipping because of additional <ActionLink {...this.data.actions.ENOCHIAN}/> casts, unavailability of <ActionLink {...this.data.actions.FIRE_IV}/> and <ActionLink {...this.data.actions.BLIZZARD_IV}/> or straight up missing out on the 15% damage bonus that <ActionLink {...this.data.actions.ENOCHIAN}/> provides.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="blm.gauge.suggestions.dropped-enochian.why">
					<ActionLink showIcon={false} {...this.data.actions.ENOCHIAN} /> was dropped <Plural value={droppedEno} one="# time" other="# times"/>.
				</Trans>,
			}))
		}

		if (this.lostPolyglot) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.XENOGLOSSY.icon,
				content: <Trans id="blm.gauge.suggestions.lost-polyglot.content">
					You lost Polyglot due to dropped <ActionLink {...this.data.actions.ENOCHIAN}/>. <ActionLink {...this.data.actions.XENOGLOSSY}/> and <ActionLink {...this.data.actions.FOUL}/> are your strongest GCDs, so always maximize their casts.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="blm.gauge.suggestions.lost-polyglot.why">
					<Plural value={this.lostPolyglot} one="# Polyglot stack was" other="# Polyglot stacks were"/> lost.
				</Trans>,
			}))
		}

		if (this.overwrittenPolyglot) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.XENOGLOSSY.icon,
				content: <Trans id="blm.gauge.suggestions.overwritten-polyglot.content">
					You overwrote Polyglot due to not casting <ActionLink {...this.data.actions.XENOGLOSSY} /> or <ActionLink {...this.data.actions.FOUL}/> for 30s after gaining a second stack. <ActionLink {...this.data.actions.XENOGLOSSY}/> and <ActionLink {...this.data.actions.FOUL}/> are your strongest GCDs, so always maximize their casts.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="blm.gauge.suggestions.overwritten-polyglot.why">
					<ActionLink showIcon={false} {...this.data.actions.XENOGLOSSY} /> got overwritten <Plural value={this.overwrittenPolyglot} one="# time" other="# times"/>.
				</Trans>,
			}))
		}
	}
}

