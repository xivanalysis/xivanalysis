import React, {Fragment} from 'react'
//import {Icon, Message} from 'semantic-ui-react'

//import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
//import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

//future-proofing for more kenki actions

const MAX_KENKI = 100

const KENKI_BUILDERS = {

	//single target
	[ACTIONS.GEKKO.id]: 10,
	[ACTIONS.KASHA.id]: 10,
	[ACTIONS.YUKIKAZE.id]: 10,
	[ACTIONS.HAKAZE.id]: 5,
	[ACTIONS.JINPU.id]: 5,
	[ACTIONS.SHIFU.id]: 5,
	
	//aoe
	[ACTIONS.MANGETSU.id]: 10,
	[ACTIONS.OKA.id]: 10,
	[ACTIONS.FUGA.id]: 5,

	//ranged
	[ACTIONS.ENPI.id]: 10,
}

const KENKI_SPENDERS = {
	[ACTIONS.HISSATSU_GYOTEN.id]: 10,
	[ACTIONS.HISSATSU_YATEN.id]: 10,
	[ACTIONS.HISSATSU_SEIGAN.id]: 15,
	[ACTIONS.HISSATSU_KAITEN.id]: 20,
	[ACTIONS.HISSATSU_SHINTEN.id]: 25,
	[ACTIONS.HISSATSU_KYUTEN.id]: 25,
	[ACTIONS.HISSATSU_GUREN.id]: 50,
}

export default class Kenki extends Module {
	static handle = 'kenki'
	static dependencies = [
		'gcd',
		'combatants',
		'cooldowns',
		'sen',
		'suggestions',
	]

	_kenki = 0
	_wastedKenki = 0

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	
_onCast(event) {
		const abilityId = event.ability.guid

		
		if (KENKI_BUILDERS[abilityId]) {
			this._addKenki(abilityId)
		}
		if (KENKI_SPENDERS[abilityId]) {
			this._kenki -= KENKI_SPENDERS[abilityId]
		}
}


_addKenki(abilityId) {
		this._kenki += KENKI_BUILDERS[abilityId]
		if (this._kenki > MAX_KENKI) {
			const waste = this._kenki - MAX_KENKI
			this._wastedKenki += waste
			this._kenki = MAX_KENKI
			return waste
		}
		return 0
	}

	_onDeath() {
		// Death just flat out resets everything. Stop dying.
		this._wastedKenki += this._kenki

		this._kenki = 0
	}
_onComplete() {
		if (this._wastedKenki >= 20) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.HAKAZE.png,
				content: <Fragment>
					You used kenki builders in a way that overcapped you.
				</Fragment>,
				severity: this._wastedKenki === 20? SEVERITY.MINOR : this._wastedKenki >= 50? SEVERITY.MEDIUM : SEVERITY.MAJOR,
				why: <Fragment>
					You wasted {this._wastedKenki} kenki by using abilities that sent you over the cap.
				</Fragment>,
			}))
		}
	}
}
