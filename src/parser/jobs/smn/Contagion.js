import React from 'react'
import {Trans} from '@lingui/react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

export default class Contagion extends Module {
	static handle = 'contagion'
	static dependencies = [
		'suggestions',
	]

	_contagionHook = null

	constructor(...args) {
		super(...args)
		this._contagionHook = this.addHook('applydebuff', {
			by: 'pet',
			abilityId: STATUSES.CONTAGION_MAGIC_VULNERABILITY_UP.id,
		}, this._onContagion)
		this.addHook('complete', this._onComplete)
	}

	_onContagion() {
		this.removeHook(this._contagionHook)
		this._contagionHook = false
	}

	_onComplete() {
		// _contagionHook will only be false if the hook has run
		if (this._contagionHook !== false) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.CONTAGION.icon,
				content: <Trans id="smn.contagion.suggestions.use-contagion.content">
					Even if primarily using Ifrit-Egi, <ActionLink {...ACTIONS.CONTAGION}/> should be used at least once during a fight, as part of your opener.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="smn.contagion.suggestions.use-contagion.why">
					Contagion was not cast at all during the fight.
				</Trans>,
			}))
		}
	}
}
