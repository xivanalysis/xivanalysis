import React, {Fragment} from 'react'

import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {ActionLink} from 'components/ui/DbLink'
import {Plural, Trans} from '@lingui/react'

const WASTED_USES_MAX_MEDIUM = 2

export default class LucidDreaming extends Module {
	static handle = 'lucid'
	static dependencies = [
		'suggestions',
	]

	_lastUse = 0
	_uses = 0
	_totalHeld = 0
	_extensions = 0
	_gcdCountHoldingLucid = 0

	_maxMP = null
	_MP = null
	_MPthresholdTime = null

	constructor(...args) {
		super(...args)

		const _filter = {
			by: 'player',
			abilityId: [ACTIONS.LUCID_DREAMING.id],
		}
		this.addEventHook('cast', _filter, this._onCastLucid)
		this.addEventHook('refreshbuff', {by: 'player', to: 'player'}, this._onRefreshLucid)
		this.addEventHook('complete', this._onComplete)
	}

	_onCastLucid(event) {
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
		//update the last use
		this._lastUse = event.timestamp
	}

	_onRefreshLucid(event) {
		if (event.ability.guid === STATUSES.LUCID_DREAMING.id) {
			this._extensions++
		}
	}

	_onComplete() {
		//uses missed reported in 1 decimal
		const holdDuration = this._uses === 0 ? this.parser.currentDuration : this._totalHeld
		const _usesMissed = Math.floor(holdDuration / (ACTIONS.LUCID_DREAMING.cooldown * 1000))

		if (_usesMissed > 1 || this._uses === 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.LUCID_DREAMING.icon,
				content: <Fragment>
					<Trans id="ast.lucid-dreaming.suggestion.content">
					Keep <ActionLink {...ACTIONS.LUCID_DREAMING} /> on cooldown for better MP management.
					</Trans>
				</Fragment>,
				severity: this._uses === 0 || _usesMissed > WASTED_USES_MAX_MEDIUM ? SEVERITY.MAJOR : SEVERITY.MEDIUM,
				why: <Fragment>
					<Trans id="ast.lucid-dreaming.suggestion.why">
						<Plural value={_usesMissed} one="# use" other="# uses" /> of Lucid Dreaming were missed by holding it for at least a total of {this.parser.formatDuration(holdDuration)}.
					</Trans>
				</Fragment>,
			}))
		}

	}

}
