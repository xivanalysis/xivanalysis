//I've heard it's cool to build your own job gauge.
import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
//import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const GAUGE_EVENTS = [
	'begincast',
	'cast',
	'damage',
	'death',
]

export const BLM_GAUGE_EVENT = Symbol('blmgauge')

/*
const AF1_ACTIONS = [
	ACTIONS.FIRE_I.id,
	ACTIONS.FIRE_II.id,
]
const UI1_ACTIONS = [
	ACTIONS.BLIZZARD_I.id,
	ACTIONS.BLIZZARD_II.id,
	ACTIONS.FREEZE.id,
]
const AF_ACTIONS = [
	ACTIONS.FIRE_I.id,
	ACTIONS.FIRE_II.id,
	ACTIONS.FIRE_III.id,
	ACTIONS.FIRE_IV.id,
]
*/

const ENOCHIAN_DURATION_REQUIRED = 30000
const ASTRAL_UMBRAL_DURATION = 13000

export default class Gauge extends Module {
	static handle = 'gauge'
	static dependencies = [
		'combatants',
		'cooldowns',
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

	_toAdd = []

	addEvent() {
		const lastAdded = this._toAdd[this._toAdd.length - 1]
		if (!lastAdded) {
			return
		}

		if (lastAdded.astralFire !== this._astralFireStacks ||
			lastAdded.umbralIce !== this._umbralIceStacks ||
			lastAdded.umbralHearts !== this._umbralHeartStacks ||
			lastAdded.enochian !== this._hasEnochian ||
			lastAdded.polyglot !== this._hasPolyglot
		) {
			if (lastAdded.insertAfter === this._normalizeIndex) {
				this._toAdd.pop()
			}

			this._toAdd.push({
				type: BLM_GAUGE_EVENT,
				insertAfter: this._normalizeIndex,
				astralFire: this._astralFireStacks,
				umbralIce: this._umbralIceStacks,
				umbralHearts: this._umbralHeartStacks,
				enochian: this._hasEnochian,
				polyglot: this._hasPolyglot,
			})
		}
	}

	constructor(...args) {
		super(...args)
		/*
		this.addHook('begincast', {by: 'player'}, this._onBegin)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('death', {to: 'player'}, this._onDeath)
		*/
		this.addHook('complete', this._onComplete)
	}

	normalise(events) {
		this._toAdd.push({
			type: BLM_GAUGE_EVENT,
			insertAfter: this._normalizeIndex,
			astralFire: this._astralFireStacks,
			umbralIce: this._umbralIceStacks,
			umbralHearts: this._umbralHeartStacks,
			enochian: this._hasEnochian,
			polyglot: this._hasPolyglot,
		})

		for (this._normalizeIndex = 0; this._normalizeIndex < events.length; this._normalizeIndex++) {
			const event = events[this._normalizeIndex]

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

		this._toAdd.forEach((i) => console.log(i))

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
		this._hasPolyglot = false
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

	onGainUmbralIceStack(event) {
		if (this._astralFireStacks > 0) {
			this.onAstralUmbralTimeout()
		} else {
			this._astralUmbralStackTimer = event.timestamp
			this._umbralIceStacks = Math.min(this._umbralIceStacks + 1, 3)
			this.addEvent()
		}
	}

	onGainAstralFireStack(event) {
		if (this._umbralIceStacks > 0) {
			this.onAstralUmbralTimeout()
		} else {
			this._astralUmbralStackTimer = event.timestamp
			this._astralFireStacks = Math.min(this._astralFireStacks + 1, 3)
			this.addEvent()
		}
	}

	onGainMaxAstralFireStacks(event) {
		this._umbralIceStacks = 0
		this._astralFireStacks = 3
		this._astralUmbralStackTimer = event.timestamp
		this.addEvent()
	}

	onGainMaxUmbralIceStacks(event) {
		this._astralFireStacks = 0
		this._umbralIceStacks = 3
		this._astralUmbralStackTimer = event.timestamp
		this.addEvent()
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
		if (event.timestamp - this._astralUmbralStackTimer > ASTRAL_UMBRAL_DURATION) {
			this.onAstralUmbralTimeout()
		}

		if (this._hasEnochian) {
			const enoRunTime = event.timestamp - this._enochianTimer
			if (enoRunTime >= ENOCHIAN_DURATION_REQUIRED) {
				this.onGainPolyglot()
				this._enochianTimer = event.timestamp - (enoRunTime - ENOCHIAN_DURATION_REQUIRED)
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
			}
			break
		case ACTIONS.BLIZZARD_I.id:
		case ACTIONS.BLIZZARD_II.id:
		case ACTIONS.FREEZE.id:
			this.onGainUmbralIceStack(event)
			break
		case ACTIONS.BLIZZARD_III.id:
			this.onGainMaxUmbralIceStacks(event)
			break
		case ACTIONS.BLIZZARD_IV.id:
			this._umbralHeartStacks = 3
			break
		case ACTIONS.FIRE_I.id:
		case ACTIONS.FIRE_II.id:
			this.onGainAstralFireStack(event)
			this.tryConsumeUmbralHearts(event, 1)
			break
		case ACTIONS.FIRE_III.id:
			this.tryConsumeUmbralHearts(event, 1)
			this.onGainMaxAstralFireStacks(event)
			break
		case ACTIONS.FLARE.id:
			this.tryConsumeUmbralHearts(event, 3, true)
			this.onGainMaxAstralFireStacks(event)
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
		// Death just flat out resets everything except for poly. Rip.
		// Not counting the loss towards the rest of the gauge loss, that'll just double up on the suggestions
		this._astralFireStacks = 0
		this._umbralIceStacks = 0
		this._umbralHeartStacks = 0
		this._astralUmbralStackTimer = 0
		this._hasEnochian = false
		this._enochianTimer = 0
	}

	_onComplete() {
		// Suggestions for lost eno
		if (this._droppedEno) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.ENOCHIAN.icon,
				content: <Fragment>
					Dropping <ActionLink {...ACTIONS.ENOCHIAN}/> may lead to lost <ActionLink {...ACTIONS.FOUL}/>, more clipping because of additional <ActionLink {...ACTIONS.ENOCHIAN}/> casts, unavailability of <ActionLink {...ACTIONS.FIRE_IV}/> and <ActionLink {...ACTIONS.BLIZZARD_IV}/> or straight up missing out on the 10% damage bonus that <ActionLink {...ACTIONS.ENOCHIAN}/> provides.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					You dropped Enochian {this._droppedEno} time{this._droppedEno > 1 && 's'}.
				</Fragment>,
			}))
		}

		if (this._lostFoul) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FOUL.icon,
				content: <Fragment>
					You lost <ActionLink {...ACTIONS.FOUL}/> due to dropped <ActionLink {...ACTIONS.ENOCHIAN}/>. <ActionLink {...ACTIONS.FOUL}/> is your strongest GCD, so always maximize its casts.
				</Fragment>,
				severity: SEVERITY.MAJOR,
				why: <Fragment>
					You lost Foul {this._lostFoul} time{this._lostFoul > 1 && 's'}.
				</Fragment>,
			}))
		}

		if (this._overwrittenFoul) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FOUL.icon,
				content: <Fragment>
					You overwrote <ActionLink {...ACTIONS.FOUL}/> due to not casting it every 30s. <ActionLink {...ACTIONS.FOUL}/> is your strongest GCD, so always maximize its casts.
				</Fragment>,
				severity: SEVERITY.MAJOR,
				why: <Fragment>
					You overwrote Foul {this._overwrittenFoul} time{this._overwrittenFoul > 1 && 's'}.
				</Fragment>,
			}))
		}
	}

	getAF() {
		return this._astralFireStacks
	}

	getUI() {
		return this._umbralIceStacks
	}

	getUH() {
		return this._umbralHeartStacks
	}
}

