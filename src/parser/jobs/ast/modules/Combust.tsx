import {Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {dependency} from 'parser/core/Module'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'
import DoTs from 'parser/core/modules/DoTs'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITIES = {
	CLIPPING: {
		2: SEVERITY.MINOR,
		4: SEVERITY.MEDIUM,
		6: SEVERITY.MAJOR,
	},
	UPTIME: {
		84: TARGET.WARN,
		91: TARGET.SUCCESS,
	},
}

export default class Combust extends DoTs {
	static handle = 'combust'

	static statusesToTrack = [
		STATUSES.COMBUST_III.id,
	]

	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	addChecklistRules() {
		this.checklist.add(new TieredRule({
			name: <Trans id="ast.dots.rule.name">Keep your DoT up</Trans>,
			description: <Trans id="ast.dots.rule.description">
				Combust III makes up a good portion of your damage. Aim to keep this DoT up at all times. It also can be used to weave (<ActionLink {...ACTIONS.DRAW} />) and manage cards, or maneuver around without dropping GCD uptime.
				</Trans>,
			tiers: SEVERITIES.UPTIME,
			requirements: [
				new Requirement({
					name: <Trans id="ast.dots.requirement.uptime.name"><ActionLink {...ACTIONS.COMBUST_III} /> uptime</Trans>,
					percent: () => this.getUptimePercent(STATUSES.COMBUST_III.id),
				}),
			],
		}))
	}

	addClippingSuggestions(clip: TODO) {
		// Suggestion for DoT clipping
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.COMBUST_III.icon,
			content: <Trans id="ast.dots.suggestion.clip.content">
					Avoid refreshing <ActionLink {...ACTIONS.COMBUST_III} /> significantly before it expires.
				</Trans>,
			why: <Trans id="ast.dots.suggestion.clip.why">
						An average of {this.parser.formatDuration(this.getClippingAmount(STATUSES.COMBUST_III.id) * 1000)} of Combust clipped every minute, for a total of {this.parser.formatDuration(clip[STATUSES.COMBUST_III.id] ?? 0)} lost to early refreshes.
					</Trans>,
			tiers: SEVERITIES.CLIPPING,
			value: this.getClippingAmount(STATUSES.COMBUST_III.id),
		}))
	}

}
