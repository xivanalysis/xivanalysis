import {Trans} from '@lingui/react'
import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

import DoTs from 'parser/core/modules/DoTs'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export default class Demolish extends DoTs {
	static dependencies = [
		...DoTs.dependencies,
		'checklist',
		'suggestions',
	]

	static statusesToTrack = [
		STATUSES.DEMOLISH.id,
	]

	addChecklistRules() {
		this.checklist.add(new Rule({
			name: <Trans id="mnk.demolish.checklist.name">Keep Demolish up</Trans>,
			description: <Trans id="mnk.demolish.checklist.description"><ActionLink {...ACTIONS.DEMOLISH}/> is your strongest finisher (assuming at least 4 DoT ticks hit).</Trans>,
			displayOrder: DISPLAY_ORDER.DEMOLISH,
			requirements: [
				new Requirement({
					name: <Trans id="mnk.demolish.checklist.requirement.name"><ActionLink {...ACTIONS.DEMOLISH}/> uptime</Trans>,
					percent: () => this.getUptimePercent(STATUSES.DEMOLISH.id),
				}),
			],
			// TODO: calculate the number of good Demolishes a fight should have
			//       and set target to allow dropping without losing a tick
			target: 85,
		}))
	}

	addClippingSuggestions(clip) {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.DEMOLISH.icon,
			content: <Trans id="mnk.demolish.suggestion.content">Avoid refreshing <ActionLink {...ACTIONS.DEMOLISH}/> significantly before its expiration, unless it would result in a bad refresh due to <StatusLink {...STATUSES.GREASED_LIGHTNING_I} /> recovery. Unnecessary refreshes risk overwriting buff snapshots.</Trans>,
			tiers: {
				7: SEVERITY.MINOR,
				10: SEVERITY.MEDIUM,
				12: SEVERITY.MAJOR,
			},
			value: this.getClippingAmount(STATUSES.DEMOLISH.id),
			why: <Trans id="mnk.demolish.suggestion.why">You lost {this.parser.formatDuration(clip[STATUSES.DEMOLISH.id])} of Demolish to early refreshes.</Trans>,
		}))
	}
}
