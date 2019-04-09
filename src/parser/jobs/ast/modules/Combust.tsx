import {Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {dependency} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import DoTs from 'parser/core/modules/DoTs'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITIES = {
	CLIPPING: {
		2500: SEVERITY.MINOR,
		5000: SEVERITY.MEDIUM,
		10000: SEVERITY.MAJOR,
	},
}

export default class Combust extends DoTs {
	static handle = 'combust'

	static statusesToTrack = [
		STATUSES.COMBUST_II.id,
	]

	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	addChecklistRules() {
		this.checklist.add(new Rule({
			name: <Trans id="ast.dots.rule.name">Keep your DoT up</Trans>,
			description: <Trans id="ast.dots.rule.description">
				While Astrologians only have one DoT, it still makes up a good portion of your damage. The duration of 30 seconds matches the cooldown on (<ActionLink {...ACTIONS.DRAW} />), giving you space to manage cards. It also enables you to maneuver around without dropping GCD uptime. Aim to keep this DoT up at all times.
				</Trans>,
			target: 90,
			requirements: [
				new Requirement({
					name: <Trans id="ast.dots.requirement.uptime.name"><ActionLink {...ACTIONS.COMBUST_II} /> uptime</Trans>,
					percent: () => this.getUptimePercent(STATUSES.COMBUST_II.id),
				}),
			],
		}))
	}

	addClippingSuggestions(clip: any) {
		// Suggestion for DoT clipping
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.COMBUST_II.icon,
			content: <Trans id="ast.dots.suggestion.clip.content">
					Avoid refreshing <ActionLink {...ACTIONS.COMBUST_II} /> significantly before it expires.
				</Trans>,
			why: <Trans id="ast.dots.suggestion.clip.why">
						{this.parser.formatDuration(clip[STATUSES.COMBUST_II.id])} of <StatusLink {...STATUSES.COMBUST_II}/> lost to early refreshes.
					</Trans>,
			tiers: SEVERITIES.CLIPPING,
			value: this.getClippingAmount(STATUSES.COMBUST_II.id),
		}))
	}

}
