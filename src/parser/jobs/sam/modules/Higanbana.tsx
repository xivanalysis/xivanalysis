import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {DoTs} from 'parser/core/modules/DoTs'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const SUGGESTION_TIERS = {
	CLIPPING: {
		1000: SEVERITY.MINOR,
		30000: SEVERITY.MEDIUM,
		60000: SEVERITY.MAJOR,
	},
}

export class Higanbana extends DoTs {
	static override handle = 'Higanbana'

	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	protected override trackedStatuses = [
		this.data.statuses.HIGANBANA.id,
	]

	protected override addChecklistRules() {
		this.checklist.add(new Rule({
			name: <Trans id="sam.higanbana.checklist.name">Keep Higanbana up</Trans>,
			displayOrder: DISPLAY_ORDER.HIGANBANA,
			description: <Trans id="sam.higanbana.checklist.description">
				As a Samurai, <DataLink action = "HIGANBANA"/> is a significant portion of your sustained damage, and is required to kept up for as much as possible, for the best damage output.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="sam.Higanbana.checklist.requirement.name"><DataLink action="HIGANBANA"/> uptime</Trans>,
					percent: () => this.getUptimePercent(this.data.statuses.HIGANBANA.id),
				}),
			],
			target: 90,
		}))
	}

	protected override addClippingSuggestions() {
		const HiganbanaClipPerMinute = this.getClippingAmount(this.data.statuses.HIGANBANA.id)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.HIGANBANA.icon,
			content: <Trans id="sam.higanbana.suggestion.content">
				Avoid refreshing <DataLink action="HIGANBANA"/> significantly before its expiration. Unnecessary refreshes risk overwriting buff snapshots.
			</Trans>,
			tiers: SUGGESTION_TIERS.CLIPPING,
			value: HiganbanaClipPerMinute,
			why: <Trans id="sam.higanbana.suggestion.why">
				An average of {this.parser.formatDuration(HiganbanaClipPerMinute, 1)} seconds of <DataLink status="HIGANBANA" /> per minute lost to early refreshes.
			</Trans>,
		}))
	}
}
