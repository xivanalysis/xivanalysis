import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {DoTs, DotDurations} from 'parser/core/modules/DoTs'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import {severityMap} from './types'

const SUGGESTION_TIERS: severityMap = {
	CLIPPING: {
		7: SEVERITY.MINOR,
		10: SEVERITY.MEDIUM,
		12: SEVERITY.MAJOR,
	},
}

export class Demolish extends DoTs {
	static override handle = 'demolish'

	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	protected override trackedStatuses = [
		this.data.statuses.DEMOLISH.id,
	]

	protected override addChecklistRules() {
		this.checklist.add(new Rule({
			name: <Trans id="mnk.demolish.checklist.name">Keep Demolish up</Trans>,
			description: <Trans id="mnk.demolish.checklist.description">
				<ActionLink action="DEMOLISH"/> is your strongest finisher (assuming at least 3 DoT ticks hit).
			</Trans>,
			displayOrder: DISPLAY_ORDER.DEMOLISH,
			requirements: [
				new Requirement({
					name: <Trans id="mnk.demolish.checklist.requirement.name"><ActionLink action="DEMOLISH"/> uptime</Trans>,
					percent: () => this.getUptimePercent(this.data.statuses.DEMOLISH.id),
				}),
			],
			// TODO: calculate the number of good Demolishes a fight should have
			//       and set target to allow dropping without losing a tick
			target: 85,
		}))
	}

	protected override addClippingSuggestions(clip: DotDurations) {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.DEMOLISH.icon,
			content: <Trans id="mnk.demolish.suggestion.content">
				Avoid refreshing <ActionLink action="DEMOLISH"/> significantly before its expiration. Unnecessary refreshes risk overwriting buff snapshots.
			</Trans>,
			tiers: SUGGESTION_TIERS.CLIPPING,
			value: this.getClippingAmount(this.data.statuses.DEMOLISH.id),
			why: <Trans id="mnk.demolish.suggestion.why">
				You lost {this.parser.formatDuration(clip[this.data.statuses.DEMOLISH.id] ?? 0)} of Demolish to early refreshes.
			</Trans>,
		}))
	}
}
