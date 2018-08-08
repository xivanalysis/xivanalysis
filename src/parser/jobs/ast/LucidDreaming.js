import React, {Fragment} from 'react'

import ACTIONS, {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const WASTED_USES_MAX_MINOR = 3
const WASTED_USES_MAX_MEDIUM = 10

const MP_NEEDS_REFRESH_THRESHOLD = 0.8

export default class LucidDreaming extends Module {
	static handle = 'lucid'
	static dependencies = [
		'combatants',
		'suggestions',
	]

	_lastUse = 0
	_uses = 0
	_totalHeld = 0

	_maxMP = null
	_MP = null
	_MPthresholdTime = null

	constructor(...args) {
		super(...args)

		const _filter = {
			by: 'player',
			abilityId: [ACTIONS.LUCID_DREAMING.id],
		}
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('cast', _filter, this._onCastLucid)
		this.addHook('complete', this._onComplete)

	}

	_onCast(event) {
		const action = getAction(event.ability.guid)

		if(!action.onGcd) {
			return
		}

		this._maxMP = this.combatants.selected.resources.maxMP
		this._MP = this.combatants.selected.resources.mp
		console.log(this.parser.formatTimestamp(event.timestamp) + ': ' + this._MP + '/' + this._maxMP)

		if (this._MP < this._maxMP * MP_NEEDS_REFRESH_THRESHOLD) {
			this._MPthresholdTime = this._MPthresholdTime || event.timestamp
		} else {
			this._MPthresholdTime = null
		}

		if (this._MPthresholdTime
			&& event.timestamp - this._MPthresholdTime > 20000
			&& ( this._uses === 0 || this._lastUse > (ACTIONS.LUCID_DREAMING.cooldown * 1000) )) {
			console.log('================== Not using LUCID? ==================')
		}

	}

	_onCastLucid(event) {
		console.log(this.parser.formatTimestamp(event.timestamp))
		console.log(event)

		this._uses++
		if (this._lastUse === 0) { this._lastUse = this.parser.fight.start_time }

		const _held = event.timestamp - this._lastUse - (ACTIONS.LUCID_DREAMING.cooldown * 1000)
		if (_held > 0) {
			this._totalHeld += _held
		}
		//update the last use
		this._lastUse = event.timestamp
	}

	_onComplete() {
		console.log(this)
		//uses missed reported in 1 decimal
		const holdDuration = this._uses === 0 ? this.parser.fightDuration : this._totalHeld
		const _usesMissed = Math.floor(10 * holdDuration / (ACTIONS.LUCID_DREAMING.cooldown * 1000)) / 10

		if (_usesMissed > 1 || this._uses === 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.LUCID_DREAMING.icon,
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
