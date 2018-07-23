import React, {Fragment} from 'react'
//import {Icon, Message} from 'semantic-ui-react'

//import {ActionLink} from 'components/ui/DbLink'
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
	_wasteBySource = {
		mug: 0,
		auto: 0,
	}

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		//this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityId = event.ability.guid
		
		if (abilityId === ACTIONS.MUG.id) {
			this._wasteBySource.mug += this._addNinki(30)
		}

		if (abilityId === ACTIONS.ATTACK.id) {
			this._wasteBySource.auto += this._addNinki(6)
		}

		if (NINKI_SPENDERS.includes(abilityId)) {
			this._ninki -= 80
		}
	}

	_addNinki(amt) {
		// Helper for adding Ninki to the running tally and calculating waste. Returns the amount wasted.
		this._ninki += amt 
		if (this._ninki > MAX_NINKI) {
			let waste = this._ninki - MAX_NINKI
			this._wastedNinki += waste
			this._ninki = MAX_NINKI
			return waste 
		}

		return 0 
	}

/* Not used for now, but perhaps in the future
	_onDeath() {
		// YOU DONE FUCKED UP NOW
		this._wastedNinki += this._ninki
		this._wasteBySource.death += this._ninki
		this._ninki = 0
	}
*/

	_onComplete() {
		if (this._wastedNinki >= 20) {
			const why = [
				this._wasteBySource.mug > 0 && `${this._wasteBySource.mug} to Mug`,
				this._wasteBySource.auto > 0 && `${this._wasteBySource.auto} to auto attacks`
			].filter(Boolean)

			let suffix = ''
			if (why.length === 1) {
				suffix = why[0].replace(/^\d+ /, '')
			} else {
				suffix = '- ' + why.join(' and ')
			}

			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SHUKIHO.icon,
				content: <Fragment>
					Avoid using Mug when above 60 Ninki and holding your Ninki spenders when near or at cap (with a few small exceptions) in order to maximize the number of spenders you can use over the course of a fight.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					Overcapping caused you to lose {this._wastedNinki} Ninki over the fight {suffix}.
				</Fragment>,
			}))
		}
	}
}
