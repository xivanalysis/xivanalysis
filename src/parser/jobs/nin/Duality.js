import React, {Fragment} from 'react'
//import {Icon, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const DUALITY_GCDS = {
	[ACTIONS.SPINNING_EDGE.id]: 1,
	[ACTIONS.GUST_SLASH.id]: 1,
	[ACTIONS.AEOLIAN_EDGE.id]: 0,
	[ACTIONS.SHADOW_FANG.id]: 1,
	[ACTIONS.ARMOR_CRUSH.id]: 1,
	[ACTIONS.THROWING_DAGGER.id]: 1,
}

export default class Duality extends Module {
	static handle = 'duality'
	static dependencies = [
		'combatants',
		'suggestions',
	]

	_badDualityUses = 0

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityId = event.ability.guid

		if (this.combatants.selected.hasStatus(STATUSES.DUALITY.id) && DUALITY_GCDS.hasOwnProperty(abilityId)) {
			this._badDualityUses += DUALITY_GCDS[abilityId] // Aeolian won't increment this, everything else will
		}
	}

	_onComplete() {
		if (this._badDualityUses > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DUALITY.icon,
				content: <Fragment>
					Avoid using <ActionLink {...ACTIONS.DUALITY}/> on any GCDs besides <ActionLink {...ACTIONS.AEOLIAN_EDGE}/>. The side effects of the GCD aren&apos;t duplicated, only the damage, so your highest damage combo hit is always ideal.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					You used Duality {this._badDualityUses} time{this._badDualityUses !== 1 && 's'} on non-optimal GCDs.
				</Fragment>,
			}))
		}
	}
}
