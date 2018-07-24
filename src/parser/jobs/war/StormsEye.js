//import React, {Fragment} from 'react'

//import {ActionLink} from 'components/ui/DbLink'
//import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
//import {Rule, Requirement} from 'parser/core/modules/Checklist'
//import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

//const STORMS_EYE_DURATION = 30000

export default class StormsEye extends Module {
	static handle = 'stormseye'
	static dependencies = [
		'checklist',
		'combatants',
		'cooldowns',
	]

	_stormsEyeUses = {}

	constructor(...args) {
		super(...args)

		const filter = {
			by: 'player',
			abilityId: STATUSES.STORMS_EYE.id,
		}
		this.addHook('applybuff', filter, this._onBuffRefresh)
		this.addHook('complete', this._onComplete)
	}
}
