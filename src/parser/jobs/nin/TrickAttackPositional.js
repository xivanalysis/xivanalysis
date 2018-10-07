import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const VULN_APPLICATION_BUFFER = 2000

export default class TrickAttackPositional extends Module {
	static handle = 'taPositional'
	static dependencies = [
		'suggestions',
	]

	_taCasts = []

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.TRICK_ATTACK.id}, this._onTrickAttack)
		this.addHook('applydebuff', {by: 'player', abilityId: STATUSES.TRICK_ATTACK_VULNERABILITY_UP.id}, this._onVulnApplied)
		this.addHook('complete', this._onComplete)
	}

	_onTrickAttack(event) {
		this._taCasts.push({timestamp: event.timestamp, missed: true})
	}

	_onVulnApplied(event) {
		if (this._taCasts.length > 0) {
			// Should always be true, but just as a precaution
			const lastCast = this._taCasts[this._taCasts.length - 1]
			if (lastCast.missed && event.timestamp - lastCast.timestamp < VULN_APPLICATION_BUFFER) {
				// Make sure the last recorded TA cast was less than two seconds ago
				// This should also always be true, but I DON'T TRUST FFLOGS ANYMORE
				lastCast.missed = false
			}
		}
	}

	_onComplete() {
		const missed = this._taCasts.filter(event => event.missed)
		if (missed.length > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.TRICK_ATTACK.icon,
				content: <Trans id="nin.ta-positional.suggestions.missed.content">
					<ActionLink {...ACTIONS.TRICK_ATTACK}/> provides a huge raid buff to you and your party. Missing the positional can be crippling to raid DPS, especially if it happens more than once in a single fight.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="nin.ta-positional.suggestions.missed.why">
					You missed the positional on Trick Attack <Plural value={missed.length} one="# time" other="# times"/>.
				</Trans>,
			}))
		}
	}
}
