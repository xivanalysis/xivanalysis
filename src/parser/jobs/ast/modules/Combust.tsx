import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Module'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'
import {DoTs, DotDurations} from 'parser/core/modules/DoTs'
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
	static override handle = 'combust'

	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	override trackedStatuses = [
		this.data.statuses.COMBUST_III.id,
	]

	override addChecklistRules() {
		this.checklist.add(new TieredRule({
			name: <Trans id="ast.dots.rule.name">Keep your DoT up</Trans>,
			description: <Trans id="ast.dots.rule.description">
				Combust III makes up a good portion of your damage. Aim to keep this DoT up at all times. It also can be used to weave (<DataLink action="DRAW" />) and manage cards, or maneuver around without dropping GCD uptime.
			</Trans>,
			tiers: SEVERITIES.UPTIME,
			requirements: [
				new Requirement({
					name: <Trans id="ast.dots.requirement.uptime.name"><DataLink action="COMBUST_III" /> uptime</Trans>,
					percent: () => this.getUptimePercent(this.data.statuses.COMBUST_III.id),
				}),
			],
		}))
	}

	override addClippingSuggestions(clip: DotDurations) {
		// Suggestion for DoT clipping
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.COMBUST_III.icon,
			content: <Trans id="ast.dots.suggestion.clip.content">
					Avoid refreshing <DataLink action="COMBUST_III" /> significantly before it expires.
			</Trans>,
			why: <Trans id="ast.dots.suggestion.clip.why">
						An average of {this.parser.formatDuration(this.getClippingAmount(this.data.statuses.COMBUST_III.id) * 1000)} of Combust clipped every minute, for a total of {this.parser.formatDuration(clip[this.data.statuses.COMBUST_III.id] ?? 0)} lost to early refreshes.
			</Trans>,
			tiers: SEVERITIES.CLIPPING,
			value: this.getClippingAmount(this.data.statuses.COMBUST_III.id),
		}))
	}

}
