import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Requirement, Rule} from 'parser/core/modules/Checklist'
import DoTs from 'parser/core/modules/DoTs'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'

export default class Goring extends DoTs {
	static handle = 'goring'
	static dependencies = [
		...DoTs.dependencies,
		'checklist',
		'suggestions',
	]

	static statusesToTrack = [
		STATUSES.GORING_BLADE.id,
	]

	addChecklistRules() {
		this.checklist.add(new Rule({
			name: 'Keep your Goring Blade up',
			description: <Fragment>
				As a Paladin, <ActionLink {...ACTIONS.GORING_BLADE} /> is a significant portion of your sustained
				damage, and is required to kept up for as much as possible, for the best damage output.
			</Fragment>,
			target: 90,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.GORING_BLADE} /> uptime</Fragment>,
					percent: () => this.getUptimePercent(STATUSES.GORING_BLADE.id),
				}),
			],
		}))
	}

	addClippingSuggestions(clip) {
		// Suggestion for Goring Blade DoT clipping
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.GORING_BLADE.icon,
			content: <Fragment>
				Avoid refreshing <ActionLink {...ACTIONS.GORING_BLADE} /> significantly before it's expiration.
			</Fragment>,
			why: <Fragment>
				{this.parser.formatDuration(clip[STATUSES.GORING_BLADE.id])} of {STATUSES.GORING_BLADE.name} lost
				to early refreshes.
			</Fragment>,
			tiers: {
				2500: SEVERITY.MINOR,
				5000: SEVERITY.MEDIUM,
				10000: SEVERITY.MAJOR,
			},
			value: this.getClippingAmount(STATUSES.GORING_BLADE.id),
		}))
	}
}
