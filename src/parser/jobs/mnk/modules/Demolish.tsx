import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {DoTs} from 'parser/core/modules/DoTs'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

const SUGGESTION_TIERS = {
	CLIPPING: {
		7000: SEVERITY.MINOR,
		10000: SEVERITY.MEDIUM,
		12000: SEVERITY.MAJOR,
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
				<DataLink action="DEMOLISH"/> is your strongest finisher (assuming at least 3 DoT ticks hit).
			</Trans>,
			displayOrder: DISPLAY_ORDER.DEMOLISH,
			requirements: [
				new Requirement({
					name: <Trans id="mnk.demolish.checklist.requirement.name"><DataLink action="DEMOLISH"/> uptime</Trans>,
					percent: () => this.getUptimePercent(this.data.statuses.DEMOLISH.id),
				}),
			],
			// TODO: calculate the number of good Demolishes a fight should have
			//       and set target to allow dropping without losing a tick
			target: 85,
		}))
	}

	protected override addClippingSuggestions() {
		const demolishClipPerMinute = this.getClippingAmount(this.data.statuses.DEMOLISH.id)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.DEMOLISH.icon,
			content: <Trans id="mnk.demolish.suggestion.content">
				Avoid refreshing <DataLink action="DEMOLISH"/> significantly before its expiration. Unnecessary refreshes risk overwriting buff snapshots.
			</Trans>,
			tiers: SUGGESTION_TIERS.CLIPPING,
			value: demolishClipPerMinute,
			why: <Trans id="mnk.demolish.suggestion.why">
				An average of {this.parser.formatDuration(demolishClipPerMinute, 1)} seconds of <DataLink status="DEMOLISH" /> per minute lost to early refreshes.
			</Trans>,
		}))
	}
}
