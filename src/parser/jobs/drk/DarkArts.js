//import React, {Fragment} from 'react'

//import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
//import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'


export default class DarkArts extends Module {
	static handle = 'darkarts'
	static title = 'Dark Arts Management'
	static dependencies = [
		'library',
		'buffs',
		'gcds',
		'suggestions',
		'combatants',
	]

	// counters (uncombo'd GCDs ignored)
	_countDA = 0 // Dark Arts
	_countDroppedDA = 0 //dropped dark arts
	_countCSnoDA = 0 // Carve and Spit, without DA (350 potency loss)
	_countDAPS = 0  // Dark Arts Power Slash    (3 in hate chain, better hate mod than 2).
	_countDASS = 0  // Dark Arts Spinning Slash (2 in hate chain)
	_countDADP = 0  // Dark Arts Dark Passenger (no slashing bonus, slightly worse than DA other abilities)
	// dark arts
	_darkArtsApplicationTime = -1

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('applybuff', {by: 'player', abilityId: STATUSES.DARK_ARTS.id}, this._onApplyDarkArts)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.DARK_ARTS.id}, this._onRemoveDarkArts)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityId = event.ability.guid
		if (this.buffs.darkArtsActive() && this.library.DARK_ARTS_CONSUMERS.includes(abilityId)) {
			// DA will be consumed and resolved, manually increment targeted counters
			if (abilityId === ACTIONS.DARK_PASSENGER.id) {
				this._countDADP += 1
			}
			if (abilityId === ACTIONS.SPINNING_SLASH.id) {
				this._countDASS += 1
			}
			if (abilityId === ACTIONS.POWER_SLASH.id) {
				this._countDAPS += 1
			}
		}
	}

	_onApplyDarkArts(event) {
		if (event.timestamp === this.parser.fight.start_time) {
			//opener DA put in with a fabricated event
			this._darkArtsOpener = true
		}
		this._countDA += 1
		this._darkArtsApplicationTime = event.timestamp
	}

	_onRemoveDarkArts(event) {
		// check if DA was consumed by an action, increment DA tally if so
		if (!(this._darkArtsApplicationTime - event.timestamp > this.library.DARK_ARTS_DURATION)) {
			// buff fell off
			this._countDroppedDA += 1
		}
		// else buff was consumed
	}

	// noinspection JSMethodCanBeStatic
	_onComplete() {
		// dropped DAs
		// better spent enmity DAPSvsDASS
		return false
	}
}
