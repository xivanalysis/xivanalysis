import React from 'react'

import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import { Suggestion, SEVERITY } from 'parser/core/modules/Suggestions'

export default class AlwaysBeCasting extends Module {
	static dependencies = [
		'gcd',
		'invuln',
		'suggestions'
	]

	// Just using this for the suggestion for now
	on_complete() {
		const fightDuration = this.parser.fightDuration - this.invuln.getUntargetableUptime()

		const gcdLength = this.gcd.getEstimate()

		this.suggestions.add(new Suggestion({
			icon: ACTIONS.PRESENCE_OF_MIND.icon,
			why: 'TODO',
			severity: SEVERITY.MEDIUM,
			content: <ul>
				<li>Fight Duration: {this.parser.formatDuration(fightDuration)}</li>
				<li>GCDs: {this.gcd.gcds.length /* TODO: Better access method*/}</li>
				<li>Possible GCDs: {Math.floor(fightDuration / gcdLength)}</li>
			</ul>
		}))
	}
}
