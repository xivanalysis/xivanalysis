//I've heard it's cool to build your own job gauge.
import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import {Event} from 'legacyEvent'
import Module, {dependency} from 'parser/core/Module'
import BrokenLog from 'parser/core/modules/BrokenLog'
import PrecastAction from 'parser/core/modules/PrecastAction'
import Suggestions, {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import UnableToAct from 'parser/core/modules/UnableToAct'
import {CompleteEvent} from 'parser/core/Parser'
import React from 'react'

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
declare module 'legacyEvent' {
	interface EventTypeRepository {
		blmgauge: EventBLMGauge
	}
}

export default class Gauge extends Module {
	static handle = 'gauge'
	static title = t('blm.gauge.title')`Gauge`

	@dependency precastAction!: PrecastAction
	@dependency suggestions!: Suggestions
	@dependency brokenLog!: BrokenLog
	@dependency unableToAct!: UnableToAct

	private astralFireStacks: number = 0
	private umbralIceStacks: number = 0
	private umbralHeartStacks: number = 0
	private astralUmbralStackTimer: number = 0
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

	protected init() {
		this.addEventHook('complete', this.onComplete)
	}

	normalise(events: Event[]) {
		// Add initial event
		this.currentTimestamp = events[0].timestamp
		this.addEvent()

		for (this.normalizeIndex = 0; this.normalizeIndex < events.length; this.normalizeIndex++) {
			const event = events[this.normalizeIndex]
			this.currentTimestamp = event.timestamp

			this.updateStackTimers(event)
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

	private onAstralUmbralTimeout(event: Event) {
		this.astralFireStacks = 0
		this.umbralIceStacks = 0
		this.astralUmbralStackTimer = 0
		this.onEnoDropped(event)
	}

	private onEnoDropped(event: Event) {
		if (this.hasEnochian) {
			this.enochianDownTimer.start = event.timestamp
			const enoRunTime = event.timestamp - this.enochianTimer
			//add the time remaining on the eno timer to total downtime
			this.enochianDownTimer.time += enoRunTime
			this.droppedEnoTimestamps.push(event.timestamp)
		}
		this.hasEnochian = false
		this.enochianTimer = 0
		this.umbralHeartStacks = 0
		this.addEvent()
	}

	private onGainPolyglot() {
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
			this.onAstralUmbralTimeout(event)
		} else {
			this.umbralIceStacks = 0
			this.astralUmbralStackTimer = event.timestamp
			this.astralFireStacks = Math.min(this.astralFireStacks + stackCount, MAX_ASTRAL_UMBRAL_STACKS)
			this.addEvent()
		}
	}

	private onGainUmbralIceStacks(event: CastEvent, stackCount: number, dropsElementOnSwap: boolean = true) {
		if (this.astralFireStacks > 0 && dropsElementOnSwap) {
			this.onAstralUmbralTimeout(event)
		} else {
			this.astralFireStacks = 0
			this.astralUmbralStackTimer = event.timestamp
			this.umbralIceStacks = Math.min(this.umbralIceStacks + stackCount, MAX_ASTRAL_UMBRAL_STACKS)
			this.addEvent()
		}
	}

	private onTransposeStacks(event: CastEvent) {
		if (this.astralFireStacks > 0 || this.umbralIceStacks > 0) {
			this.astralUmbralStackTimer = event.timestamp
			if (this.astralFireStacks > 0) {
				this.astralFireStacks = 0
				this.umbralIceStacks = 1
			} else {
				this.astralFireStacks = 1
				this.umbralIceStacks = 0
			}
			this.addEvent()
		}
	}

	private tryGainUmbralHearts(event: CastEvent, count: number) {
		if (this.umbralIceStacks > 0) {
			this.umbralHeartStacks = Math.min(this.umbralHeartStacks + count, MAX_UMBRAL_HEART_STACKS)
			this.addEvent()
		}
	}

	private tryConsumeUmbralHearts(event: CastEvent, count:  number, force: boolean = false) {
		if (this.umbralHeartStacks > 0 && (this.astralFireStacks > 0 || force)) {
			this.umbralHeartStacks = Math.max(this.umbralHeartStacks - count, 0)
			this.addEvent()
		}
	}

	private updateStackTimers(event: Event) {
		if ((this.astralFireStacks > 0 || this.umbralIceStacks > 0) &&
			(event.timestamp - this.astralUmbralStackTimer > ASTRAL_UMBRAL_DURATION)
		) {
			this.onAstralUmbralTimeout(event)
		}

		if (this.hasEnochian) {
			const enoRunTime = event.timestamp - this.enochianTimer
			if (enoRunTime >= ENOCHIAN_DURATION_REQUIRED) {
				this.enochianTimer = event.timestamp - (enoRunTime - ENOCHIAN_DURATION_REQUIRED)
				this.onGainPolyglot()
			}
		}
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
		const unableToActTime = this.unableToAct.getDowntimes()
			.filter(downtime => Math.max(0, downtime.end - downtime.start) >= ASTRAL_UMBRAL_DURATION)
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
			this.tryGainUmbralHearts(event, 1)
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
			this.tryGainUmbralHearts(event, 1)
			break
		case ACTIONS.FIRE_I.id:
		case ACTIONS.FIRE_II.id:
			this.tryConsumeUmbralHearts(event, 1)
			this.onGainAstralFireStacks(event, 1)
			break
		case ACTIONS.FIRE_III.id:
			this.tryConsumeUmbralHearts(event, 1)
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
			this.tryConsumeUmbralHearts(event, 1)
			break
		case ACTIONS.DESPAIR.id:
			this.onGainAstralFireStacks(event, MAX_ASTRAL_UMBRAL_STACKS, false)
			break
		case ACTIONS.FLARE.id:
			this.tryConsumeUmbralHearts(event, FLARE_MAX_HEART_CONSUMPTION, true)
			this.onGainAstralFireStacks(event, MAX_ASTRAL_UMBRAL_STACKS, false)
			break
		case ACTIONS.XENOGLOSSY.id:
		case ACTIONS.FOUL.id:
			this.onConsumePolyglot()
			break
		case ACTIONS.TRANSPOSE.id:
			this.onTransposeStacks(event)
			break
		}
	}

	private onDeath() {
		// Not counting the loss towards the rest of the gauge loss, that'll just double up on the suggestions
		this.astralFireStacks = 0
		this.umbralIceStacks = 0
		this.umbralHeartStacks = 0
		this.astralUmbralStackTimer = 0
		this.hasEnochian = false
		this.polyglotStacks = 0
		this.enochianTimer = 0
		this.addEvent()
	}

	private onComplete(event: CompleteEvent) {
		if (this.enochianDownTimer.start) {
			this.enoDownTimerStop(event)
		}
		this.lostPolyglot = this.countLostPolyglots(this.enochianDownTimer.time)

		// Find out how many of the enochian drops ocurred during times where the player could not act for longer than the AF/UI buff timer. If they could act, they could've kept it going, so warn about those.
		const droppedEno = this.droppedEnoTimestamps.filter(drop => this.unableToAct.getDowntimes(drop, drop).filter(downtime => Math.max(0, downtime.end - downtime.start) >= ASTRAL_UMBRAL_DURATION).length === 0).length
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

