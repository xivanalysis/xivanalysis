import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

export default class RaidenThrust extends Module {
	static handle = 'raiden'
	static dependencies = [
		'downtime',
		'suggestions',
	]

	_trueThrustOkay = true // TT is fine at the start of a fight and after downtime long enough to break a combo; otherwise, should be Raiden
	_lastOpenerCast = 0
	_badTrueThrusts = 0

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.TRUE_THRUST.id}, this._onTrueThrustCast)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.RAIDEN_THRUST.id}, event => this._lastOpenerCast = event.timestamp)
		this.addHook('complete', this._onComplete)
	}

	_onTrueThrustCast(event) {
		const downtime = this.downtime.getDowntime(this._lastOpenerCast, event.timestamp)
		this._lastOpenerCast = event.timestamp
		if (downtime > 0) {
			// We're coming out of downtime, so TT is okay
			// Note: This -does- make the assumption that the downtime was long enough to break the combo, so it may forgive the rare case
			// where the player reset their combo after a short (like, 10s or less) downtime without needing to, but that should be fine
			this._trueThrustOkay = true
		}

		if (this._trueThrustOkay) {
			this._trueThrustOkay = false
			return
		}

		this._badTrueThrusts++
	}

	_onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.RAIDEN_THRUST.icon,
			content: <Trans id="drg.raiden.suggestions.true-thrust.content">
				Try to minimize your number of <ActionLink {...ACTIONS.TRUE_THRUST}/> casts over the course of the fight that could have been <ActionLink {...ACTIONS.RAIDEN_THRUST}/> casts instead. Using it at the start of a fight or after a prolonged downtime is unavoidable, but every mid-rotation cast is a significant potency loss from the lost proc and either the broken combo or the missed positional that caused it.
			</Trans>,
			value: this._badTrueThrusts,
			tiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				6: SEVERITY.MAJOR,
			},
			why: <Trans id="drg.raiden.suggestions.true-thrust.why">
				You used True Thrust <Plural value={this._badTrueThrusts} one="# time" other="# times"/> in your regular rotations.
			</Trans>,
		}))
	}
}
