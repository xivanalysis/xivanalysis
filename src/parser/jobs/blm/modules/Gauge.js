//I've heard it's cool to build your own job gauge.
import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const GAUGE_EVENTS = [
	'begincast',
	'cast',
	'damage',
	'death',
]

export const BLM_GAUGE_EVENT = Symbol('blmgauge')

const ENOCHIAN_DURATION_REQUIRED = 30000
const ASTRAL_UMBRAL_DURATION = 15000
const MAX_ASTRAL_UMBRAL_STACKS = 3
const MAX_UMBRAL_HEART_STACKS = 3
const FLARE_MAX_HEART_CONSUMPTION = 3
const MAX_POLYGLOT_STACKS = 2

export default class Gauge extends Module {
	static handle = 'gauge'
	static title = t('blm.gauge.title')`Gauge`
	static dependencies = [
		'precastAction', // eslint-disable-line @xivanalysis/no-unused-dependencies
		'suggestions',
		'brokenLog',
		'unableToAct',
	]

	_astralFireStacks = 0
	_umbralIceStacks = 0
	_umbralHeartStacks = 0
	_astralUmbralStackTimer = 0
	_hasEnochian = false
	_enochianTimer = 0
	_enochianDownTimer = {
		start: 0,
		stop: 0,
		time: 0,
	}
	//_hasPolyglot = false
	_polyglotStacks = 0

	_droppedEnoTimestamps = []
	_lostPolyglot = 0
	_overwrittenPolyglot = 0

	_normalizeIndex = 0
	_currentTimestamp = 0

	_toAdd = []
	_lastAdded = null

	gaugeValuesChanged(lastGaugeEvent) {
		if (!lastGaugeEvent) {
			return true
		}
		if (lastGaugeEvent.astralFire !== this._astralFireStacks ||
			lastGaugeEvent.umbralIce !== this._umbralIceStacks ||
			lastGaugeEvent.umbralHearts !== this._umbralHeartStacks ||
			lastGaugeEvent.enochian !== this._hasEnochian ||
			lastGaugeEvent.polyglot !== this._polyglotStacks
		) {
			return true
		}
		return false
	}

	addEvent() {
		const lastAdded = this._toAdd.length > 0 ? this._toAdd[this._toAdd.length - 1] : null

		if (this.gaugeValuesChanged(lastAdded)) {
			this._toAdd.push({
				type: BLM_GAUGE_EVENT,
				timestamp: this._currentTimestamp,
				insertAfter: this._normalizeIndex,
				astralFire: this._astralFireStacks,
				umbralIce: this._umbralIceStacks,
				umbralHearts: this._umbralHeartStacks,
				enochian: this._hasEnochian,
				polyglot: this._polyglotStacks,
				lastGaugeEvent: this._lastAdded,
			})
			this._lastAdded = this._toAdd[this._toAdd.length - 1]
		}
	}

	constructor(...args) {
		super(...args)
		this.addEventHook('complete', this._onComplete)
	}

	normalise(events) {
		// Add initial event
		this._currentTimestamp = events[0].timestamp
		this.addEvent()

		for (this._normalizeIndex = 0; this._normalizeIndex < events.length; this._normalizeIndex++) {
			const event = events[this._normalizeIndex]
			this._currentTimestamp = event.timestamp

			this.updateStackTimers(event)

			if (!GAUGE_EVENTS.includes(event.type)) { continue }
			if (this.parser.byPlayer(event)) {
				switch (event.type) {
				case 'begincast':
					break
				case 'cast':
					this._onCast(event)
					break
				case 'damage':
					break
				}
			}
			if (event.type === 'death' && this.parser.toPlayer(event)) {
				this._onDeath(event)
			}
		}

		// Add all the events we gathered up in, in order
		let offset = 0
		this._toAdd.sort((a, b) => a.insertAfter - b.insertAfter).forEach(event => {
			events.splice(event.insertAfter + 1 + offset, 0, event)
			offset++
		})

		return events
	}

	onAstralUmbralTimeout(event) {
		this._astralFireStacks = 0
		this._umbralIceStacks = 0
		this._astralUmbralStackTimer = 0
		this.onEnoDropped(event)
	}

	onEnoDropped(event) {
		if (this._hasEnochian) {
			this._enochianDownTimer.start = event.timestamp
			const enoRunTime = event.timestamp - this._enochianTimer
			//add the time remaining on the eno timer to total downtime
			this._enochianDownTimer.time += enoRunTime
			this._droppedEnoTimestamps.push(event.timestamp)
		}
		this._hasEnochian = false
		this._enochianTimer = 0
		this._umbralHeartStacks = 0
		this.addEvent()
	}

	onGainPolyglot() {
		this._polyglotStacks++
		if (this._polyglotStacks > MAX_POLYGLOT_STACKS) {
			this._overwrittenPolyglot++
		}
		this._polyglotStacks = Math.min(this._polyglotStacks, MAX_POLYGLOT_STACKS)
		this.addEvent()
	}

	onConsumePolyglot() {
		if (!this._polyglotStacks > 0 && this._overwrittenPolyglot > 0) {
			// Safety to catch ordering issues where Foul is used late enough to trigger our overwrite check but happens before Poly actually overwrites
			this._overwrittenPolyglot--
		}
		this._polyglotStacks = Math.max(this._polyglotStacks - 1, 0)
		this.addEvent()
	}

	onGainAstralFireStacks(event, stackCount, dropsElementOnSwap = true) {
		if (this._umbralIceStacks > 0 && dropsElementOnSwap) {
			this.onAstralUmbralTimeout(event)
		} else {
			this._umbralIceStacks = 0
			this._astralUmbralStackTimer = event.timestamp
			this._astralFireStacks = Math.min(this._astralFireStacks + stackCount, MAX_ASTRAL_UMBRAL_STACKS)
			this.addEvent()
		}
	}

	onGainUmbralIceStacks(event, stackCount, dropsElementOnSwap = true) {
		if (this._astralFireStacks > 0 && dropsElementOnSwap) {
			this.onAstralUmbralTimeout(event)
		} else {
			this._astralFireStacks = 0
			this._astralUmbralStackTimer = event.timestamp
			this._umbralIceStacks = Math.min(this._umbralIceStacks + stackCount, MAX_ASTRAL_UMBRAL_STACKS)
			this.addEvent()
		}
	}

	onTransposeStacks(event) {
		if (this._astralFireStacks > 0 || this._umbralIceStacks > 0) {
			this._astralUmbralStackTimer = event.timestamp
			if (this._astralFireStacks > 0) {
				this._astralFireStacks = 0
				this._umbralIceStacks = 1
			} else {
				this._astralFireStacks = 1
				this._umbralIceStacks = 0
			}
			this.addEvent()
		}
	}

	tryGainUmbralHearts(event, count) {
		if (this._umbralIceStacks > 0) {
			this._umbralHeartStacks = Math.min(this._umbralHeartStacks + count, MAX_UMBRAL_HEART_STACKS)
			this.addEvent()
		}
	}

	tryConsumeUmbralHearts(event, count, force = false) {
		if (this._umbralHeartStacks > 0 && (this._astralFireStacks > 0 || force)) {
			this._umbralHeartStacks = Math.max(this._umbralHeartStacks - count, 0)
			this.addEvent()
		}
	}

	updateStackTimers(event) {
		if ((this._astralFireStacks > 0 || this._umbralIceStacks > 0) &&
			(event.timestamp - this._astralUmbralStackTimer > ASTRAL_UMBRAL_DURATION)
		) {
			this.onAstralUmbralTimeout(event)
		}

		if (this._hasEnochian) {
			const enoRunTime = event.timestamp - this._enochianTimer
			if (enoRunTime >= ENOCHIAN_DURATION_REQUIRED) {
				this._enochianTimer = event.timestamp - (enoRunTime - ENOCHIAN_DURATION_REQUIRED)
				this.onGainPolyglot()
			}
		}
	}

	_startEnoTimer(event) {
		this._hasEnochian = true
		this._enochianTimer = event.timestamp
		if (this._enochianDownTimer.start) {
			this._enoDownTimerStop(event)
		}
	}

	_enoDownTimerStop(event) {
		this._enochianDownTimer.stop = event.timestamp
		this._enochianDownTimer.time += Math.max(this._enochianDownTimer.stop - this._enochianDownTimer.start, 0)
		//reset the timer again to prevent weirdness/errors
		this._enochianDownTimer.start = 0
		this._enochianDownTimer.stop = 0
	}

	// Refund unable-to-act time if the downtime window was longer than the AF/UI timer
	_countLostPolyglots(time) {
		const unableToActTime = this.unableToAct.getDowntimes().filter(downtime => Math.max(0, downtime.end - downtime.start) >= ASTRAL_UMBRAL_DURATION).reduce((duration, downtime) => duration + Math.max(0, downtime.end - downtime.start), 0)
		return Math.floor((time - unableToActTime)/ENOCHIAN_DURATION_REQUIRED)
	}

	_onCast(event) {
		const abilityId = event.ability.guid

		switch (abilityId) {
		case ACTIONS.ENOCHIAN.id:
			if (!this._astralFireStacks && !this._umbralIceStacks) {
				this.brokenLog.trigger(this, 'no stack eno', (
					<Trans id="blm.gauge.trigger.no-stack-eno">
						<ActionLink {...ACTIONS.ENOCHIAN}/> was cast without any Astral Fire or Umbral Ice stacks detected.
					</Trans>
				))
			}
			if (!this._hasEnochian) {
				this._startEnoTimer(event)
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
			if (!this._hasEnochian) {
				this.brokenLog.trigger(this, 'no eno b4', (
					<Trans id="blm.gauge.trigger.no-eno-b4">
						<ActionLink {...ACTIONS.BLIZZARD_IV}/> was cast while <ActionLink {...ACTIONS.ENOCHIAN}/> was deemed inactive.
					</Trans>
				))
				this._startEnoTimer(event)
			}
			this._umbralHeartStacks = MAX_UMBRAL_HEART_STACKS
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
			if (!this._hasEnochian) {
				this.brokenLog.trigger(this, 'no eno f4', (
					<Trans id="blm.gauge.trigger.no-eno-f4">
						<ActionLink {...ACTIONS.FIRE_IV}/> was cast while <ActionLink {...ACTIONS.ENOCHIAN}/> was deemed inactive.
					</Trans>
				))
				this._startEnoTimer(event)
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

	_onDeath() {
		// Not counting the loss towards the rest of the gauge loss, that'll just double up on the suggestions
		this._astralFireStacks = 0
		this._umbralIceStacks = 0
		this._umbralHeartStacks = 0
		this._astralUmbralStackTimer = 0
		this._hasEnochian = false
		this._polyglotStacks = 0
		this._enochianTimer = 0
		this.addEvent()
	}

	_onComplete(event) {
		if (this._enochianDownTimer.start) {
			this._enoDownTimerStop(event)
		}
		this._lostPolyglot = this._countLostPolyglots(this._enochianDownTimer.time)

		// Find out how many of the enochian drops ocurred during times where the player could not act for longer than the AF/UI buff timer. If they could act, they could've kept it going, so warn about those.
		const droppedEno = this._droppedEnoTimestamps.filter(drop => this.unableToAct.getDowntimes(drop, drop).filter(downtime => Math.max(0, downtime.end - downtime.start) >= ASTRAL_UMBRAL_DURATION).length === 0).length
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

		if (this._lostPolyglot) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.XENOGLOSSY.icon,
				content: <Trans id="blm.gauge.suggestions.lost-polyglot.content">
					You lost Polyglot due to dropped <ActionLink {...ACTIONS.ENOCHIAN}/>. <ActionLink {...ACTIONS.XENOGLOSSY}/> and <ActionLink {...ACTIONS.FOUL}/> are your strongest GCDs, so always maximize their casts.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="blm.gauge.suggestions.lost-polyglot.why">
					<Plural value={this._lostPolyglot} one="# Polyglot stack was" other="# Polyglot stacks were"/> lost.
				</Trans>,
			}))
		}

		if (this._overwrittenPolyglot) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.XENOGLOSSY.icon,
				content: <Trans id="blm.gauge.suggestions.overwritten-polyglot.content">
					You overwrote Polyglot due to not casting <ActionLink {...ACTIONS.XENOGLOSSY} /> or <ActionLink {...ACTIONS.FOUL}/> for 30s after gaining a second stack. <ActionLink {...ACTIONS.XENOGLOSSY}/> and <ActionLink {...ACTIONS.FOUL}/> are your strongest GCDs, so always maximize their casts.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="blm.gauge.suggestions.overwritten-polyglot.why">
					Xenoglossy got overwritten <Plural value={this._overwrittenPolyglot} one="# time" other="# times"/>.
				</Trans>,
			}))
		}
	}
}

