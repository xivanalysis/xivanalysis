import React, {Fragment} from 'react'

import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'


const WASTED_USES_MAX_MINOR = 3
const WASTED_USES_MAX_MEDIUM = 10

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
		//uses missed reported in 1 decimal
		const holdDuration = this._uses === 0 ? this.parser.fightDuration : this._totalHeld
		const _usesMissed = Math.floor(10 * holdDuration / (ACTIONS.DIVINE_BENISON.cooldown * 1000)) / 10

		if (_usesMissed > 1 || this._uses === 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DIVINE_BENISON.icon,
				content: <Fragment>
					Use Divine Benison{this._uses > 0 && ' more frequently'}. Frequent uses of Divine Benison can mitigate a large amount of damage over the course of a fight, potentially resulting in less required healing GCDs.
				</Fragment>,
				severity: this._uses === 0 || _usesMissed > WASTED_USES_MAX_MEDIUM ? SEVERITY.MAJOR : _usesMissed > WASTED_USES_MAX_MINOR ? SEVERITY.MEDIUM : SEVERITY.MINOR,
				why: <Fragment>
					About {_usesMissed} uses of Divine Benison were missed by holding it for at least a total of {this.parser.formatDuration(holdDuration)}.
				</Fragment>,
			}))
		}
	}
}
