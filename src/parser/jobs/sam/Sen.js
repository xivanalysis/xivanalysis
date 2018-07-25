import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
//import Rotation from 'components/ui/Rotation' (nope, nothing here too)
import ACTIONS, {getAction} from 'data/ACTIONS'
//import STATUSES from 'data/STATUSES' (nothing to see here)
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// 1 sen value for each finisher. using finisher with sen you already have is bad.
const MAX_GEKKO_SEN = 1
const MAX_KASHA_SEN = 1
const MAX_YUKIKAZE_SEN = 1

export default class Sen extends Module {
	static handle = 'sen'
	static dependencies = [
		'combatants',
		'cooldowns',
		'gcd',
		'suggestions',
	]

	_gekkosen = 0
	_kashasen = 0
	_yukikazesen = 0
	
	_wastedsen = 0

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)

	}

	_onCast(event) {
		const actionId = event.ability.guid

		//now for the ugly 100% Ryan code.
	
		if(actionId === ACTIONS.HAGAKURE.id) {
			this._Sen2Kenki()
		}

		else if(actionId ===ACTIONS.HIGANBANA.id || actionId === ACTIONS.TENKA_GOKEN.id || actionId === ACTIONS.MIDARE_SETSUGEKKA.id) {
			this._removeSen()
		}

		else if(actionId === ACTIONS.GEKKO.id) {
			this._addGekkoSen() 
		}
		
		else if(actionId === ACTIONS.KASHA.id) {
			this._addKashaSen() 
		}

		else if(actionId === ACTIONS.YUKIKAZE.id) {
			this._addYukikazeSen() 
		}

	}

	_addGekkoSen() {
		this._gekkosen += 1
		if (this._gekkosen > MAX_GEKKO_SEN) {
			const waste = this._gekkosen - MAX_GEKKO_SEN
			this._wastedsen += waste
			return waste
		}
		return 0
	}


	 _addKashaSen()  {
                this._kashasen += 1
                if (this._kashasen > MAX_KASHA_SEN) {
                        const waste = this._kashasen - MAX_KASHA_SEN
                        this._wastedsen += waste
                        return waste
                }
                return 0
        }
	
	 _addYukikazeSen()  {
                this._yukikazesen += 1
                if (this._yukikazesen > MAX_YUKIKAZE_SEN) {
                        const waste = this._yukikazesen - MAX_YUKIKAZE_SEN
                        this._wastedsen += waste
                        return waste
                }
                return 0
        }

	_removeSen()	{
		this._gekkosen = 0
		this._kashasen = 0
		this._yukikazesen = 0
	
		return 0
	}

	_Sen2Kenki() { //TODO: UPDATE THIS FOR KENKI GAIN AFTER IMPLMENTING KENKI
		this._gekkosen = 0
                this._kashasen = 0
                this._yukikazesen = 0

                return 0

	}
	_onDeath() {
		//Death is such a waste
		this._wastedsen += (this._gekkosen + this._kashasen + this._yukikzaesen)

		this._gekkosen = this._kashasen = this._yukikazesen = 0
	}

	_onComplete() {
		if (this._wastedsen >= 1) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.MEIKYO_SHISUI.icon,
				content: <Fragment>
					You used <ActionLink {...ACTIONS.GEKKO}/>, <ActionLink {...ACTIONS.KASHA}/>, <ActionLink {...ACTIONS.YUKIKAZE}/>, at a time when you already had that sen, thus wasting a combo because it did not give you sen.
				</Fragment>,
				severity: this._wastedsen === 1? SEVERITY.MINOR : this._wastedsen >= 3? SEVERITY.MEDIUM : SEVERITY.MAJOR,
				why: <Fragment>
					You lost {this._wastedsen} sen by using finishing combos that gave you sen you already had.
				</Fragment>,
			}))
		}
	}
}



