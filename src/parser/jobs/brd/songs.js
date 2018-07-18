import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

export default class Gauge extends Module {
	static dependencies = [
		'cooldowns',
		'suggestions',
	]

	_WANDERERS_MINUET = 0
	_MAGES_BALLAD = 0
	_ARMYS_PAEON = 0

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}
	_onCast(event) {
		const abilityId = event.ability.guid

		if (abilityId === ACTIONS.WANDERERS_MINUET.id) {
			this._WANDERERS_MINUET ++
		}
		if (abilityId === ACTIONS.MAGES_BALLAD.id) {
			this._MAGES_BALLAD ++
		}
		if (abilityId === ACTIONS.ARMYS_PAEON.id) {
			this._ARMYS_PAEON ++
		}
	}
	_onDeath() {
		// No song up when you lick the floor
		console.log('Stop licking the floor, thk')
	}
	_onComplete() {
		// Suggestions to git gud
		console.log(this._WANDERERS_MINUET + this._MAGES_BALLAD + this._ARMYS_PAEON + ' - ' +  this._WANDERERS_MINUET + ',' + this._MAGES_BALLAD + ',' + this._ARMYS_PAEON)
	}
}
