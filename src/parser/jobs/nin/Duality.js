import {Trans, Plural} from '@lingui/react'
import React from 'react'

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
		this.addHook('cast', {by: 'player', abilityId: Object.keys(DUALITY_GCDS).map(Number)}, this._onCast)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		if (this.combatants.selected.hasStatus(STATUSES.DUALITY.id)) {
			this._badDualityUses += DUALITY_GCDS[event.ability.guid] // Aeolian won't increment this, everything else will
		}
	}

	_onComplete() {
		if (this._badDualityUses > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DUALITY.icon,
				content: <Trans id="nin.duality.suggestions.misuse.content">
					Avoid using <ActionLink {...ACTIONS.DUALITY}/> on any GCDs besides <ActionLink {...ACTIONS.AEOLIAN_EDGE}/>. The side effects of the GCD aren't duplicated, only the damage, so your highest damage combo hit is always ideal.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="nin.duality.suggestions.misuse.why">
					You used Duality <Plural value={this._badDualityUses} one="# time" other="# times"/> on non-optimal GCDs.
				</Trans>,
			}))
		}
	}
}
