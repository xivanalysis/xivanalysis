import React from 'react'

import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'

const WASTED_USE_TIERS = {
	3: SEVERITY.MINOR,
	10: SEVERITY.MEDIUM,
	20: SEVERITY.MAJOR, //if not used at all, it'll be set to 100 for severity checking
}

export default class Benison extends Module {
	static handle = 'benison'
	static dependencies = [
		'suggestions',
	]

	_lastUse = 0
	_uses = 0
	_totalHeld = 0

	constructor(...args) {
		super(...args)

		const _filter = {
			by: 'player',
			abilityId: [ACTIONS.DIVINE_BENISON.id],
		}
		this.addHook('cast', _filter, this._onApplyBenison)
		this.addHook('complete', this._onComplete)
	}

	_onApplyBenison(event) {
		this._uses++
		if (this._lastUse === 0) { this._lastUse = this.parser.fight.start_time }

		const _held = event.timestamp - this._lastUse - (ACTIONS.DIVINE_BENISON.cooldown * 1000)
		if (_held > 0) {
			this._totalHeld += _held
		}
		//update the last use
		this._lastUse = event.timestamp
	}

	_onComplete() {
		const holdDuration = this._uses === 0 ? this.parser.fightDuration : this._totalHeld
		const _usesMissed = Math.floor(holdDuration / (ACTIONS.DIVINE_BENISON.cooldown * 1000))

		if (_usesMissed > 1 || this._uses === 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.DIVINE_BENISON.icon,
				content: <Trans id="whm.benison.suggestion.content">
					Use <ActionLink {...ACTIONS.DIVINE_BENISON} /> more frequently. Frequent uses can mitigate a large amount of damage over the course of a fight, potentially resulting in less required healing GCDs.
				</Trans>,
				tiers: WASTED_USE_TIERS,
				value: this._uses === 0 ? 100 : _usesMissed,
				why: <Trans id="whm.benison.suggestion.why">
					About {_usesMissed} uses of <ActionLink {...ACTIONS.DIVINE_BENISON} /> were missed by holding it for at least a total of {this.parser.formatDuration(holdDuration)}.
				</Trans>,
			}))
		}
	}
}
