import React, {Fragment} from 'react'
//import {Icon, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
//import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// Constants
const MAX_NINKI = 100
const NINKI_SPENDERS = [
	ACTIONS.HELLFROG_MEDIUM.id,
	ACTIONS.BHAVACAKRA.id,
	ACTIONS.TEN_CHI_JIN.id,
]

export default class Ninki extends Module {
	static handle = 'ninki'
	static dependencies = [
		'suggestions',
	]
	
	_ninki = 0
	_wastedNinki = 0

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityId = event.ability.guid
		
		if (abilityId === ACTIONS.MUG.id) {
			this._addNinki(30)
		}

		if (abilityId === ACTIONS.ATTACK.id) {
			this._addNinki(6)
		}

		if (NINKI_SPENDERS.includes(abilityId)) {
			this._ninki -= 80
		}
	}

	_addNinki(amt) {
		// Helper for adding Ninki to the running tally and calculating waste
		this._ninki += amt 
		if (this._ninki > MAX_NINKI) {
			this._wastedNinki += (this._ninki - MAX_NINKI)
			this._ninki = MAX_NINKI
		}
	}

	_onDeath() {
		// YOU DONE FUCKED UP NOW
		this._wastedNinki += this._ninki
		this._ninki = 0
	}

	_onComplete() {
		if (this._wastedNinki >= 10) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.BHAVACAKRA.icon,
				content: <Fragment>
					You used <ActionLink {...ACTIONS.MUG}/> or held your spenders through auto-attacks in a way that overcapped you.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					You wasted {this._wastedNinki} Ninki by using abilities that overcapped your Ninki gauge or dying.
				</Fragment>,
			}))
		}
	}
}
