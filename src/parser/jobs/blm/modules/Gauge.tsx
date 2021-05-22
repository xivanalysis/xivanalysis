//I've heard it's cool to build your own job gauge.
import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {CastEvent} from 'fflogs'
import {Analyser} from 'parser/core/Analyser'
import {TimestampHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import BrokenLog from 'parser/core/modules/BrokenLog'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {UnableToAct} from 'parser/core/modules/UnableToAct'
import {CompleteEvent} from 'parser/core/Parser'
import React from 'react'
import Elements from './Elements'

const GAUGE_EVENTS = [
	'begincast',
	'cast',
	'damage',
	'death',
]

const ENOCHIAN_DURATION_REQUIRED = 30000
const ASTRAL_UMBRAL_DURATION = 15000
const MAX_ASTRAL_UMBRAL_STACKS = 3
const MAX_UMBRAL_HEART_STACKS = 3
const FLARE_MAX_HEART_CONSUMPTION = 3
const MAX_POLYGLOT_STACKS = 2

export interface EventBLMGauge {
	type: 'blmgauge',
	timestamp: number,
	insertAfter: number,
	astralFire: number,
	umbralIce: number,
	umbralHearts: number,
	polyglot: number,
	enochian: boolean,
	lastGaugeEvent: EventBLMGauge | null,
}

declare module 'event' {
	interface EventTypeRepository {
		blmgauge: EventBLMGauge
	}
}
declare module 'legacyEvent' {
	interface EventTypeRepository {
		blmgauge: EventBLMGauge
	}
}

export default class Gauge extends Analyser {
	static handle = 'gauge'
	static title = t('blm.gauge.title')`Gauge`

	@dependency suggestions!: Suggestions
	@dependency brokenLog!: BrokenLog
	@dependency unableToAct!: UnableToAct
	@dependency data!: Data
	@dependency elements!: Elements

	private astralFireStacks: number = 0
	private umbralIceStacks: number = 0
	private umbralHeartStacks: number = 0
	private hasEnochian: boolean = false
	private enochianTimer: number = 0
	private enochianDownTimer: { start: number, stop: number, time: number} = {
		start: 0,
		stop: 0,
		time: 0,
	}
	private polyglotStacks: number = 0

	private droppedEnoTimestamps: number[] = []
	private lostPolyglot: number = 0
	private overwrittenPolyglot: number = 0

	private normalizeIndex: number = 0
	private currentTimestamp: number = 0

	private toAdd: EventBLMGauge[] = []
	private lastAdded: EventBLMGauge | null = null

	private astralUmbralTimeoutHook!: TimestampHook | null
	private gainPolyglotHook!: TimestampHook | null

	private affectsGaugeOnDamage: number[] = [
		...this.elements.fireSpells,
		...this.elements.targetedIceSpells,
	]
	private affectsGaugeOnCast: number[] = [
		...this.elements.untargetedIceSpells,
		this.data.actions.TRANSPOSE.id,
		this.data.actions.ENOCHIAN.id,
		this.data.actions.FOUL.id,
		this.data.actions.XENOGLOSSY.id,
	]

	gaugeValuesChanged(lastGaugeEvent: EventBLMGauge | null) {
		if (!lastGaugeEvent) {
			return true
		}
		if (lastGaugeEvent.astralFire !== this.astralFireStacks ||
			lastGaugeEvent.umbralIce !== this.umbralIceStacks ||
			lastGaugeEvent.umbralHearts !== this.umbralHeartStacks ||
			lastGaugeEvent.enochian !== this.hasEnochian ||
			lastGaugeEvent.polyglot !== this.polyglotStacks
		) {
			return true
		}
		return false
	}

	addEvent() {
		const lastAdded = this.toAdd.length > 0 ? this.toAdd[this.toAdd.length - 1] : null

		if (this.astralFireStacks > 0 || this.umbralIceStacks > 0) {
			if (!this.astralUmbralTimeoutHook) {
				this.astralUmbralTimeoutHook = this.addTimestampHook(this.currentTimestamp + ASTRAL_UMBRAL_DURATION, () => this.onAstralUmbralTimeout())
			}
			if (!this.gainPolyglotHook && this.hasEnochian) {
				this.gainPolyglotHook = this.addTimestampHook(this.currentTimestamp + ENOCHIAN_DURATION_REQUIRED, this.onGainPolyglot)
			}
		}

		if (this.gaugeValuesChanged(lastAdded)) {
			this.toAdd.push({
				type: 'blmgauge',
				timestamp: this.currentTimestamp,
				insertAfter: this.normalizeIndex,
				astralFire: this.astralFireStacks,
				umbralIce: this.umbralIceStacks,
				umbralHearts: this.umbralHeartStacks,
				enochian: this.hasEnochian,
				polyglot: this.polyglotStacks,
				lastGaugeEvent: this.lastAdded,
			})
			this.lastAdded = this.toAdd[this.toAdd.length - 1]
		}
	}

	initialse() {
		const playerFilter = filter<Event>()
			.source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(oneOf(this.affectsGaugeOnCast)), this.onGaugeAffectingCast)
		this.addEventHook(playerFilter.type('damage').cause())
		this.addEventHook('complete', this.onComplete)
	}

	private onGaugeAffectingCast(event: Events['action'] | Events['damage'])
	normalise(events: Event[]) {
		// Add initial event
		this.currentTimestamp = events[0].timestamp
		this.addEvent()

		for (this.normalizeIndex = 0; this.normalizeIndex < events.length; this.normalizeIndex++) {
			const event = events[this.normalizeIndex]
			this.currentTimestamp = event.timestamp

			if (!GAUGE_EVENTS.includes(event.type)) { continue }
			if (this.parser.byPlayer(event)) {
				switch (event.type) {
				case 'begincast':
					break
				case 'cast':
					this.onCast(event)
					break
				case 'damage':
					break
				}
			}
			if (event.type === 'death' && this.parser.toPlayer(event)) {
				this.onDeath()
			}
		}

		// Add all the events we gathered up in, in order
		let offset = 0
		this.toAdd.sort((a, b) => a.insertAfter - b.insertAfter).forEach(event => {
			events.splice(event.insertAfter + 1 + offset, 0, event)
			offset++
		})

		return events
	}

	private onAstralUmbralTimeout(flagIssues: boolean = true) {
		this.tryExpireAstralUmbralTimeout()

		this.astralFireStacks = 0
		this.umbralIceStacks = 0

		this.onEnoDropped(flagIssues)
	}

	private onEnoDropped(flagIssues: boolean = true) {
		this.tryExpirePolyglotGain()

		if (this.hasEnochian && flagIssues) {
			this.enochianDownTimer.start = this.currentTimestamp
			const enoRunTime = this.currentTimestamp - this.enochianTimer
			//add the time remaining on the eno timer to total downtime
			this.enochianDownTimer.time += enoRunTime
			this.droppedEnoTimestamps.push(this.currentTimestamp)
		}
		this.hasEnochian = false
		this.enochianTimer = 0
		this.umbralHeartStacks = 0

		this.addEvent()
	}

	private onGainPolyglot() {
		this.tryExpirePolyglotGain()

		this.polyglotStacks++
		if (this.polyglotStacks > MAX_POLYGLOT_STACKS) {
			this.overwrittenPolyglot++
		}
		this.polyglotStacks = Math.min(this.polyglotStacks, MAX_POLYGLOT_STACKS)

		this.addEvent()
	}

	private onConsumePolyglot() {
		if (this.polyglotStacks <= 0 && this.overwrittenPolyglot > 0) {
			// Safety to catch ordering issues where Foul is used late enough to trigger our overwrite check but happens before Poly actually overwrites
			this.overwrittenPolyglot--
		}
		this.polyglotStacks = Math.max(this.polyglotStacks - 1, 0)
		this.addEvent()
	}

	private onGainAstralFireStacks(event: CastEvent, stackCount: number, dropsElementOnSwap: boolean = true) {
		if (this.umbralIceStacks > 0 && dropsElementOnSwap) {
			this.onAstralUmbralTimeout()
		} else {
			this.tryExpireAstralUmbralTimeout()

			this.umbralIceStacks = 0
			this.astralFireStacks = Math.min(this.astralFireStacks + stackCount, MAX_ASTRAL_UMBRAL_STACKS)

			this.addEvent()
		}
	}

	private onGainUmbralIceStacks(event: CastEvent, stackCount: number, dropsElementOnSwap: boolean = true) {
		if (this.astralFireStacks > 0 && dropsElementOnSwap) {
			this.onAstralUmbralTimeout()
		} else {
			this.tryExpireAstralUmbralTimeout()

			this.astralFireStacks = 0
			this.umbralIceStacks = Math.min(this.umbralIceStacks + stackCount, MAX_ASTRAL_UMBRAL_STACKS)

			this.addEvent()
		}
	}

	private onTransposeStacks() {
		if (this.astralFireStacks <= 0 && this.umbralIceStacks <= 0) { return }

		this.tryExpireAstralUmbralTimeout()

		if (this.astralFireStacks > 0) {
			this.astralFireStacks = 0
			this.umbralIceStacks = 1
		} else {
			this.astralFireStacks = 1
			this.umbralIceStacks = 0
		}

		this.addEvent()
	}

	private tryExpireAstralUmbralTimeout() {
		if (!this.astralUmbralTimeoutHook) { return }

		this.removeTimestampHook(this.astralUmbralTimeoutHook)
		this.astralUmbralTimeoutHook = null
	}

	private tryExpirePolyglotGain() {
		if (!this.gainPolyglotHook) { return }

		this.removeTimestampHook(this.gainPolyglotHook)
		this.gainPolyglotHook = null
	}

	private tryGainUmbralHearts(count: number) {
		if (this.umbralIceStacks <= 0) { return }

		this.umbralHeartStacks = Math.min(this.umbralHeartStacks + count, MAX_UMBRAL_HEART_STACKS)

		this.addEvent()
	}

	private tryConsumeUmbralHearts(count:  number, force: boolean = false) {
		if (!(this.umbralHeartStacks > 0 && (this.astralFireStacks > 0 || force))) { return }

		this.umbralHeartStacks = Math.max(this.umbralHeartStacks - count, 0)
		this.addEvent()
	}

	private startEnoTimer(event: CastEvent) {
		this.hasEnochian = true
		this.enochianTimer = event.timestamp
		if (this.enochianDownTimer.start) {
			this.enoDownTimerStop(event)
		}
	}

	private enoDownTimerStop(event: CastEvent | CompleteEvent) {
		this.enochianDownTimer.stop = event.timestamp
		this.enochianDownTimer.time += Math.max(this.enochianDownTimer.stop - this.enochianDownTimer.start, 0)
		//reset the timer again to prevent weirdness/errors
		this.enochianDownTimer.start = 0
		this.enochianDownTimer.stop = 0
	}

	// Refund unable-to-act time if the downtime window was longer than the AF/UI timer
	private countLostPolyglots(time: number) {
		const unableToActTime = this.unableToAct.getWindows()
			.map((window) => ({
				start: this.parser.epochToFflogs(window.start),
				end: this.parser.epochToFflogs(window.end),
			}))
			.filter((downtime) => Math.max(0, downtime.end - downtime.start) >= ASTRAL_UMBRAL_DURATION)
			.reduce((duration, downtime) => duration + Math.max(0, downtime.end - downtime.start), 0)
		return Math.floor((time - unableToActTime)/ENOCHIAN_DURATION_REQUIRED)
	}

	private onCast(event: CastEvent) {
		const abilityId = event.ability.guid

		switch (abilityId) {
		case ACTIONS.ENOCHIAN.id:
			if (!this.astralFireStacks && !this.umbralIceStacks) {
				this.brokenLog.trigger(this, 'no stack eno', (
					<Trans id="blm.gauge.trigger.no-stack-eno">
						<ActionLink {...ACTIONS.ENOCHIAN}/> was cast without any Astral Fire or Umbral Ice stacks detected.
					</Trans>
				))
			}
			if (!this.hasEnochian) {
				this.startEnoTimer(event)
				this.addEvent()
			}
			break
		case ACTIONS.BLIZZARD_I.id:
		case ACTIONS.BLIZZARD_II.id:
		case ACTIONS.FREEZE.id:
			this.onGainUmbralIceStacks(event, MAX_ASTRAL_UMBRAL_STACKS, false)
			this.tryGainUmbralHearts(1)
			break
		case ACTIONS.BLIZZARD_III.id:
			this.onGainUmbralIceStacks(event, MAX_ASTRAL_UMBRAL_STACKS, false)
			break
		case ACTIONS.BLIZZARD_IV.id:
			if (!this.hasEnochian) {
				this.brokenLog.trigger(this, 'no eno b4', (
					<Trans id="blm.gauge.trigger.no-eno-b4">
						<ActionLink {...ACTIONS.BLIZZARD_IV}/> was cast while <ActionLink {...ACTIONS.ENOCHIAN}/> was deemed inactive.
					</Trans>
				))
				this.startEnoTimer(event)
			}
			this.umbralHeartStacks = MAX_UMBRAL_HEART_STACKS
			this.addEvent()
			break
		case ACTIONS.UMBRAL_SOUL.id:
			this.onGainUmbralIceStacks(event, 1)
			this.tryGainUmbralHearts(1)
			break
		case ACTIONS.FIRE_I.id:
		case ACTIONS.FIRE_II.id:
			this.tryConsumeUmbralHearts(1)
			this.onGainAstralFireStacks(event, 1)
			break
		case ACTIONS.FIRE_III.id:
			this.tryConsumeUmbralHearts(1)
			this.onGainAstralFireStacks(event, MAX_ASTRAL_UMBRAL_STACKS, false)
			break
		case ACTIONS.FIRE_IV.id:
			if (!this.hasEnochian) {
				this.brokenLog.trigger(this, 'no eno f4', (
					<Trans id="blm.gauge.trigger.no-eno-f4">
						<ActionLink {...ACTIONS.FIRE_IV}/> was cast while <ActionLink {...ACTIONS.ENOCHIAN}/> was deemed inactive.
					</Trans>
				))
				this.startEnoTimer(event)
			}
			this.tryConsumeUmbralHearts(1)
			break
		case ACTIONS.DESPAIR.id:
			this.onGainAstralFireStacks(event, MAX_ASTRAL_UMBRAL_STACKS, false)
			break
		case ACTIONS.FLARE.id:
			this.tryConsumeUmbralHearts(FLARE_MAX_HEART_CONSUMPTION, true)
			this.onGainAstralFireStacks(event, MAX_ASTRAL_UMBRAL_STACKS, false)
			break
		case ACTIONS.XENOGLOSSY.id:
		case ACTIONS.FOUL.id:
			this.onConsumePolyglot()
			break
		case ACTIONS.TRANSPOSE.id:
			this.onTransposeStacks()
			break
		}
	}

	private onDeath() {
		// Not counting the loss towards the rest of the gauge loss, that'll just double up on the suggestions
		this.onAstralUmbralTimeout(false)
	}

	private onComplete(event: CompleteEvent) {
		if (this.enochianDownTimer.start) {
			this.enoDownTimerStop(event)
		}
		this.lostPolyglot = this.countLostPolyglots(this.enochianDownTimer.time)

		// Find out how many of the enochian drops ocurred during times where the player could not act for longer than the AF/UI buff timer. If they could act, they could've kept it going, so warn about those.
		const droppedEno = this.droppedEnoTimestamps.filter(drop =>
			this.unableToAct
				.getWindows({
					start: this.parser.fflogsToEpoch(drop),
					end: this.parser.fflogsToEpoch(drop),
				})
				.filter((downtime) => Math.max(0, downtime.end - downtime.start) >= ASTRAL_UMBRAL_DURATION)
				.length === 0
		).length
		if (droppedEno) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.ENOCHIAN.icon,
				content: <Trans id="blm.gauge.suggestions.dropped-enochian.content">
					Dropping <ActionLink {...ACTIONS.ENOCHIAN}/> may lead to lost <ActionLink {...ACTIONS.XENOGLOSSY}/> or <ActionLink {...ACTIONS.FOUL}/> casts, more clipping because of additional <ActionLink {...ACTIONS.ENOCHIAN}/> casts, unavailability of <ActionLink {...ACTIONS.FIRE_IV}/> and <ActionLink {...ACTIONS.BLIZZARD_IV}/> or straight up missing out on the 15% damage bonus that <ActionLink {...ACTIONS.ENOCHIAN}/> provides.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="blm.gauge.suggestions.dropped-enochian.why">
					{droppedEno} dropped Enochian <Plural value={droppedEno} one="buff" other="buffs"/>.
				</Trans>,
			}))
		}

		if (this.lostPolyglot) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.XENOGLOSSY.icon,
				content: <Trans id="blm.gauge.suggestions.lost-polyglot.content">
					You lost Polyglot due to dropped <ActionLink {...ACTIONS.ENOCHIAN}/>. <ActionLink {...ACTIONS.XENOGLOSSY}/> and <ActionLink {...ACTIONS.FOUL}/> are your strongest GCDs, so always maximize their casts.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="blm.gauge.suggestions.lost-polyglot.why">
					<Plural value={this.lostPolyglot} one="# Polyglot stack was" other="# Polyglot stacks were"/> lost.
				</Trans>,
			}))
		}

		if (this.overwrittenPolyglot) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.XENOGLOSSY.icon,
				content: <Trans id="blm.gauge.suggestions.overwritten-polyglot.content">
					You overwrote Polyglot due to not casting <ActionLink {...ACTIONS.XENOGLOSSY} /> or <ActionLink {...ACTIONS.FOUL}/> for 30s after gaining a second stack. <ActionLink {...ACTIONS.XENOGLOSSY}/> and <ActionLink {...ACTIONS.FOUL}/> are your strongest GCDs, so always maximize their casts.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="blm.gauge.suggestions.overwritten-polyglot.why">
					Xenoglossy got overwritten <Plural value={this.overwrittenPolyglot} one="# time" other="# times"/>.
				</Trans>,
			}))
		}
	}
}

