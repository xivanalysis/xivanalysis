//I've heard it's cool to build your own job gauge.
import React from 'react'
import {Trans, Plural, i18nMark} from '@lingui/react'

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
const ASTRAL_UMBRAL_DURATION = 13000
const MAX_ASTRAL_UMBRAL_STACKS = 3
const MAX_UMBRAL_HEART_STACKS = 3
const FLARE_MAX_HEART_CONSUMPTION = 3

export default class Gauge extends Module {
	static handle = 'gauge'
	static i18n_id = i18nMark('blm.gauge.title')
	static dependencies = [
		'precastAction', // eslint-disable-line xivanalysis/no-unused-dependencies
		'suggestions',
	]

	_astralFireStacks = 0
	_umbralIceStacks = 0
	_umbralHeartStacks = 0
	_astralUmbralStackTimer = 0
	_hasEnochian = false
	_enochianTimer = 0
	_hasPolyglot = false

	_droppedEno = 0
	_lostFoul = 0
	_overwrittenFoul = 0

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
			lastGaugeEvent.polyglot !== this._hasPolyglot
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
				polyglot: this._hasPolyglot,
				lastGaugeEvent: this._lastAdded,
			})
			this._lastAdded = this._toAdd[this._toAdd.length - 1]
		}
	}

	constructor(...args) {
		super(...args)
		this.addHook('complete', this._onComplete)
	}

	normalise(events) {
		// Add initial event
		this._currentTimestamp = events[0].timestamp
		this.addEvent()

		for (this._normalizeIndex = 0; this._normalizeIndex < events.length; this._normalizeIndex++) {
			const event = events[this._normalizeIndex]
			this._currentTimestamp = event.timestamp

			this.updateStackTimers(event)

			if (!this.parser.byPlayer(event) || !GAUGE_EVENTS.includes(event.type)) {
				continue
			}

			switch (event.type) {
			case 'begincast':
				break
			case 'cast':
				this._onCast(event)
				break
			case 'damage':
				break
			case 'death':
				this._onDeath(event)
				break
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

	onAstralUmbralTimeout() {
		this._astralFireStacks = 0
		this._umbralIceStacks = 0
		this._astralUmbralStackTimer = 0
		this.onEnoDropped()
	}

	onEnoDropped() {
		if (this._hasEnochian) {
			if (!this._hasPolyglot) {
				this._lostFoul++
			}
			this._droppedEno++
		}
		this._hasEnochian = false
		this._enochianTimer = 0
		this._umbralHeartStacks = 0
		this.addEvent()
	}

	onGainPolyglot() {
		if (this._hasPolyglot) {
			this._overwrittenFoul++
		}
		this._hasPolyglot = true
		this.addEvent()
	}

	onConsumePolyglot() {
		if (!this._hasPolyglot && this._overwrittenFoul > 0) {
			// Safety to catch ordering issues where Foul is used late enough to trigger our overwrite check but happens before Poly actually overwrites
			this._overwrittenFoul--
		}
		this._hasPolyglot = false
		this.addEvent()
	}

	onGainAstralFireStacks(event, stackCount, dropsElementOnSwap = true) {
		if (this._umbralIceStacks > 0 && dropsElementOnSwap) {
			this.onAstralUmbralTimeout()
		} else {
			this._umbralIceStacks = 0
			this._astralUmbralStackTimer = event.timestamp
			this._astralFireStacks = Math.min(this._astralFireStacks + stackCount, MAX_ASTRAL_UMBRAL_STACKS)
			this.addEvent()
		}
	}

	onGainUmbralIceStacks(event, stackCount, dropsElementOnSwap = true) {
		if (this._astralFireStacks > 0 && dropsElementOnSwap) {
			this.onAstralUmbralTimeout()
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
			this.onAstralUmbralTimeout()
		}

		if (this._hasEnochian) {
			const enoRunTime = event.timestamp - this._enochianTimer
			if (enoRunTime >= ENOCHIAN_DURATION_REQUIRED) {
				this._enochianTimer = event.timestamp - (enoRunTime - ENOCHIAN_DURATION_REQUIRED)
				this.onGainPolyglot()
			}
		}
	}

	_onCast(event) {
		const abilityId = event.ability.guid

		switch (abilityId) {
		case ACTIONS.ENOCHIAN.id:
			if (!this._hasEnochian) {
				this._hasEnochian = true
				this._enochianTimer = event.timestamp
				this.addEvent()
			}
			break
		case ACTIONS.BLIZZARD_I.id:
		case ACTIONS.BLIZZARD_II.id:
		case ACTIONS.FREEZE.id:
			this.onGainUmbralIceStacks(event, 1)
			break
		case ACTIONS.BLIZZARD_III.id:
			this.onGainUmbralIceStacks(event, MAX_ASTRAL_UMBRAL_STACKS, false)
			break
		case ACTIONS.BLIZZARD_IV.id:
			this._umbralHeartStacks = MAX_UMBRAL_HEART_STACKS
			this.addEvent()
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
			this.tryConsumeUmbralHearts(event, 1)
			break
		case ACTIONS.FLARE.id:
			this.tryConsumeUmbralHearts(event, FLARE_MAX_HEART_CONSUMPTION, true)
			this.onGainAstralFireStacks(event, MAX_ASTRAL_UMBRAL_STACKS, false)
			break
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
		this._hasPolyglot = false
		this._enochianTimer = 0
		this.addEvent()
	}

	_onComplete() {
		// Suggestions for lost eno
		if (this._droppedEno) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.ENOCHIAN.icon,
				content: <Trans id="blm.gauge.suggestions.dropped-enochian.content">
					Dropping <ActionLink {...ACTIONS.ENOCHIAN}/> may lead to lost <ActionLink {...ACTIONS.FOUL}/>, more clipping because of additional <ActionLink {...ACTIONS.ENOCHIAN}/> casts, unavailability of <ActionLink {...ACTIONS.FIRE_IV}/> and <ActionLink {...ACTIONS.BLIZZARD_IV}/> or straight up missing out on the 10% damage bonus that <ActionLink {...ACTIONS.ENOCHIAN}/> provides.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="blm.gauge.suggestions.dropped-enochian.why">
					{this._droppedEno} dropped Enochian <Plural value={this._droppedEno} one="buff" other="buffs"/>.
				</Trans>,
			}))
		}

		if (this._lostFoul) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FOUL.icon,
				content: <Trans id="blm.gauge.suggestions.lost-foul.content">
					You lost <ActionLink {...ACTIONS.FOUL}/> due to dropped <ActionLink {...ACTIONS.ENOCHIAN}/>. <ActionLink {...ACTIONS.FOUL}/> is your strongest GCD, so always maximize its casts.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="blm.gauge.suggestions.lost-foul.why">
					<Plural value={this._lostFoul} one="# Foul was" other="# Fouls were"/> lost.
				</Trans>,
			}))
		}

		if (this._overwrittenFoul) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FOUL.icon,
				content: <Trans id="blm.gauge.suggestions.overwritten-foul.content">
					You overwrote <ActionLink {...ACTIONS.FOUL}/> due to not casting it every 30s. <ActionLink {...ACTIONS.FOUL}/> is your strongest GCD, so always maximize its casts.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="blm.gauge.suggestions.overwritten-foul.why">
					Foul got overwritten <Plural value={this._overwrittenFoul} one="# time" other="# times"/>.
				</Trans>,
			}))
		}
	}
}

