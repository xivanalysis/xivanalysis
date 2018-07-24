import React, {Fragment} from 'react'

import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'


const WASTED_USES_MAX_MINOR = 0 //a single lost assize is worth not being hidden as a minor issue
const WASTED_USES_MAX_MEDIUM = 2

//uses the benison code for now, but should also check healing efficiency
export default class Assize extends Module {
	static handle = 'assize'
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
			abilityId: [ACTIONS.ASSIZE.id],
		}
		this.addHook('cast', _filter, this._onApplyBenison)
		this.addHook('complete', this._onComplete)
	}

	_onApplyBenison(event) {
		this._uses++
		if (this._lastUse === 0) { this._lastUse = this.parser.fight.start_time }

		const _held = event.timestamp - this._lastUse - (ACTIONS.ASSIZE.cooldown * 1000)
		if (_held > 0) {
			this._totalHeld += _held
		}
		//update the last use
		this._lastUse = event.timestamp
	}

	_onComplete() {
		//uses missed reported in 1 decimal
		const holdDuration = this._uses === 0 ? this.parser.fightDuration: this._totalHeld
		const _usesMissed = Math.floor(10 * holdDuration / (ACTIONS.ASSIZE.cooldown * 1000)) / 10
		if (_usesMissed > 1 || this._uses === 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.ASSIZE.icon,
				content: <Fragment>
					Use Assize{this._uses > 0 && ' more frequently'}. Frequent use of Assize is typically a DPS gain and helps with MP management.
				</Fragment>,
				severity: this._uses === 0 || _usesMissed > WASTED_USES_MAX_MEDIUM ? SEVERITY.MAJOR : _usesMissed > WASTED_USES_MAX_MINOR ? SEVERITY.MEDIUM : SEVERITY.MINOR,
				why: <Fragment>
					About {_usesMissed} uses of Assize were missed by holding it for at least a total of {this.parser.formatDuration(holdDuration)}.
				</Fragment>,
			}))
		}
	}
}
