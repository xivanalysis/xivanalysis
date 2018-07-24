//I've heard it's cool to build your own job gauge.
import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
//import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

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

const ENOCHIAN_DURATION_REQUIRED = 30000
const ASTRAL_UMBRAL_DURATION = 13000

export default class Gauge extends Module {
	static handle = 'gauge'
	static dependencies = [
		'combatants',
		'cooldowns',
		'suggestions',
	]

	_AF = 0
	_UI = 0
	_UH = 0
	_AFUITimer = 0
	_eno = false
	_enoTimer = 0
	_poly = 0
	_droppedEno = 0
	_lostFoul = 0
	_overwrittenFoul = 0
	_beginOfCast = 0

	constructor(...args) {
		super(...args)
		this.addHook('begincast', {by: 'player'}, this._onBegin)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	enoTimerCheck(event) {
		const AFUIRunTime = event.timestamp - this._AFUITimer

		//reseting AF/UI and dropping eno due to going past the timer
		if (AFUIRunTime > ASTRAL_UMBRAL_DURATION) {
			if (this._eno) {
				this._eno = false
				this._enoTimer = 0
				this._droppedEno ++
				if (this._poly === 0) {
					this._lostFoul ++
				}
			}
			this._AF = 0
			this._UI = 0
			this._UH = 0
			this._AFUITimer = 0
		}
	}

	enoDrop() {
		this._UI = 0
		this._AF = 0
		this._UH = 0
		if (this._poly === 0 && this._eno) {
			this._eno = false
			this._enoTimer = 0
			this._droppedEno ++
			this._lostFoul ++
		}
		if (this._poly > 0 && this._eno) {
			this._eno = false
			this._enoTimer = 0
			this._droppedEno ++
		}
	}

	_onBegin(event) {
		this.enoTimerCheck(event)
	}

	_onCast(event) {
		const abilityId = event.ability.guid
		this.enoTimerCheck(event)

		//check if eno is active and update the eno timer for foul. Check for foul overwriting.
		if (this._eno) {
			const enoRunTime = event.timestamp - this._enoTimer
			const numberOfFouls = Math.floor(enoRunTime/ENOCHIAN_DURATION_REQUIRED)
			if (numberOfFouls > 0) {
				const offSet = enoRunTime % ENOCHIAN_DURATION_REQUIRED
				this._enoTimer = event.timestamp - offSet
				this._poly ++
				if (this._poly > 1) {
					this._poly = 1
					this._overwrittenFoul ++
				}
			}
		}

		//set _eno to 1 to show it's on. Maybe should have used true/false. Also set timestamp.
		if (abilityId === ACTIONS.ENOCHIAN.id) {
			if (!this._eno) {
				this._eno = true
				this._enoTimer = event.timestamp
			}
			this._eno = true
		}

		//check for AF1 actions and update buffs accordingly. Also check for lost fouls and dropped enos while you're at it.
		if (AF1_ACTIONS.includes(abilityId)) {
			if (this._UI > 0) {
				this.enoDrop()

			} else {
				this._AFUITimer = event.timestamp
				this._AF ++
				this._AF = Math.min(this.AF, 3)
			}
		}

		//check for UI1 actions and update buffs accordingly. Also check for lost fouls and dropped enos while you're at it.
		if (UI1_ACTIONS.includes(abilityId)) {
			if (this._AF > 0) {
				this.enoDrop()

			} else {
				this._AFUITimer = event.timestamp
				this._UI ++
				this._UI = Math.min(this._UI, 3)
			}
		}

		//keep track of UH
		if (abilityId === ACTIONS.BLIZZARD_IV.id) {
			this._UH = 3
		}
		//getting rid of UHs one AF action at a time
		if (AF_ACTIONS.includes(abilityId) && this._UH > 0 && this._UI === 0) {
			this._UH --
			this._UH = Math.max(this._UH, 0)
		}

		//Flare resetting UHs
		if (abilityId === ACTIONS.FLARE.id && this._UH > 0) {
			this._UH = 0
		}

		//do F3 things
		if (abilityId === ACTIONS.FIRE_III.id) {
			this._UI = 0
			this._AF = 3
			this._AFUITimer = event.timestamp
		}

		//do B3 things
		if (abilityId === ACTIONS.BLIZZARD_III.id) {
			this._UI = 3
			this._AF = 0
			this._AFUITimer = event.timestamp
		}

		//Foul support and poly adjustment
		if (abilityId === ACTIONS.FOUL.id) {
			this._poly = 0
		}

		if (abilityId === ACTIONS.TRANSPOSE.id) {
			if (this._AF > 0) {
				this._AF = 0
				this._UI = 1
				this._AFUITimer = event.timestamp
			}
			if (this._UI > 0) {
				this._UI = 0
				this._AF = 1
				this._AFUITimer = event.timestamp
			}
		}
	}

	_onDeath() {
		// Death just flat out resets everything except for poly. Rip.
		// Not counting the loss towards the rest of the gauge loss, that'll just double up on the suggestions
		this._AF = 0
		this._UI = 0
		this._UH = 0
		this._AFUITimer = 0
		this._eno = false
		this._enoTimer = 0
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
		return this._AF
	}

	getUI() {
		return this._UI
	}

	getUH() {
		return this._UH
	}
}

