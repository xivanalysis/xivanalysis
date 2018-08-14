import React, {Fragment} from 'react'

import ACTIONS, {getAction} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {ActionLink} from 'components/ui/DbLink'

const WASTED_USES_MAX_MEDIUM = 2
const MP_NEEDS_REFRESH_THRESHOLD = 0.80
const LUCID_DRIFT_ALLOWANCE = 1.1

// Lucid seems to recover about 5% of the user's max MP per tick?
// TODO: Find Math supporting the above observation, apply to calculations
export default class LucidDreaming extends Module {
	static handle = 'lucid'
	static dependencies = [
		'combatants',
		'suggestions',
	]

	_lastUse = 0
	_uses = 0
	_totalHeld = 0
	_extensions = 0

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
		this.addHook('refreshbuff', {by: 'player', to: 'player', abilityId: [STATUSES.LUCID_DREAMING.id]}, this._onRefreshLucid)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const action = getAction(event.ability.guid)

		if (!action.onGcd) {
			return
		}

		// keep track of how long they've been below MP threshold to warrant a Lucid usage
		this._maxMP = this.combatants.selected.resources.maxMP
		this._MP = this.combatants.selected.resources.mp
		console.log(this.parser.formatTimestamp(event.timestamp) + ': ' + this._MP + '/' + this._maxMP)

		if (this._MP < this._maxMP * MP_NEEDS_REFRESH_THRESHOLD) {
			this._MPthresholdTime = this._MPthresholdTime || event.timestamp
		} else {
			this._MPthresholdTime = null
		}

		const isLucidReady = event.timestamp > (this._lastUse === 0 ? this.parser.fight.start_time : this._lastUse) + (ACTIONS.LUCID_DREAMING.cooldown * LUCID_DRIFT_ALLOWANCE * 1000)

		// Looks for a situation where they held Lucid, even though they had MP below threshold
		// console.log(this._MPthresholdTime ? 'Low MP duration : ' + this.parser.formatDuration(event.timestamp - this._MPthresholdTime) : null )
		// console.log('Is Lucid ready? ' + (isLucidReady))
		if (this._MPthresholdTime
			&& (this._uses === 0 || isLucidReady)) {
			// console.log('No lucid being used. lastUse: ' + this.parser.formatTimestamp(this._lastUse) + ' Uses: ' + this._uses)
			// console.log('time for next Lucid: ' + this.parser.formatTimestamp(this._lastUse + (ACTIONS.LUCID_DREAMING.cooldown * 1000)))
			// console.log('time now: ' + this.parser.formatTimestamp(event.timestamp))
		}

	}

	_onCastLucid(event) {
		console.log(this.parser.formatTimestamp(event.timestamp))
		console.log(event)

		// if(this._uses === 0) {
		// 	const _held = event.timestamp - this.parser.fight.start_time
		// }

		this._uses++

		if (this._lastUse === 0) { this._lastUse = this.parser.fight.start_time }

		let _held = 0

		if (this._uses === 1) {
			// The first use, take holding as from the first minute of the fight
			_held = event.timestamp - this.parser.fight.start_time
		} else {
			// Take holding as from the time it comes off cooldown
			_held = event.timestamp - this._lastUse - (ACTIONS.LUCID_DREAMING.cooldown * 1000)
		}

		if (_held > 0) {
			this._totalHeld += _held
		}
		console.log(this.parser.formatDuration(_held))
		//update the last use
		this._lastUse = event.timestamp
	}

	_onRefreshLucid(event) {
		console.log(this.parser.formatTimestamp(event.timestamp))
		console.log(event)

		this._extensions++
	}

	_onComplete() {
		console.log(this)
		//uses missed reported in 1 decimal
		const holdDuration = this._uses === 0 ? this.parser.fightDuration : this._totalHeld
		console.log(holdDuration)
		console.log(this.parser.formatDuration(holdDuration))
		const _usesMissed = Math.floor(holdDuration / (ACTIONS.LUCID_DREAMING.cooldown * 1000))
		const _extensionsMissed = this._uses - this._extensions

		if (_usesMissed > 1 || this._uses === 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.LUCID_DREAMING.icon,
				content: <Fragment>
					Keep <ActionLink {...ACTIONS.LUCID_DREAMING} /> on cooldown, unless there's a specific part of the fight you need to drop aggro.
					Astrologian's have a low MP pool. If they adhere to "Always be casting" they frequently find themselves desiring more MP.
				</Fragment>,
				severity: this._uses === 0 || _usesMissed > WASTED_USES_MAX_MEDIUM ? SEVERITY.MAJOR : SEVERITY.MEDIUM,
				why: <Fragment>
					About {_usesMissed} uses of Lucid Dreaming were missed by holding it for at least a total of {this.parser.formatDuration(holdDuration)}.
				</Fragment>,
			}))
		}

		if (_extensionsMissed > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.LUCID_DREAMING.icon,
				content: <Fragment>
					You missed out on extending <ActionLink {...ACTIONS.LUCID_DREAMING} /> with <ActionLink {...ACTIONS.CELESTIAL_OPPOSITION} />.
					Try to line these cooldowns up to maximize return.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					{_extensionsMissed} of {this._uses} Lucid Dreaming uses were not extended.
				</Fragment>,
			}))
		}
	}

}
