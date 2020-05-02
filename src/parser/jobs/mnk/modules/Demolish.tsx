import {Trans} from '@lingui/react'
import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

import {dependency} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import DoTs from 'parser/core/modules/DoTs'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const SEVERITIES = {
	CLIPPING: {
		7: SEVERITY.MINOR,
		10: SEVERITY.MEDIUM,
		12: SEVERITY.MAJOR,
	},
}

export default class Demolish extends DoTs {
	static handle = 'demolish'

	static statusesToTrack = [
		STATUSES.DEMOLISH.id,
	]

	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	addChecklistRules() {
		this.checklist.add(new Rule({
			name: <Trans id="mnk.demolish.checklist.name">Keep Demolish up</Trans>,
			description: <Trans id="mnk.demolish.checklist.description">
				<ActionLink {...ACTIONS.DEMOLISH}/> is your strongest finisher (assuming at least 4 DoT ticks hit).
			</Trans>,
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

	addClippingSuggestions(clip: TODO) {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.DEMOLISH.icon,
			content: <Trans id="mnk.demolish.suggestion.content">
				Avoid refreshing <ActionLink {...ACTIONS.DEMOLISH}/> significantly before its expiration, unless it would result in a bad refresh due to <StatusLink {...STATUSES.GREASED_LIGHTNING} /> recovery. Unnecessary refreshes risk overwriting buff snapshots.
			</Trans>,
			tiers: SEVERITIES.CLIPPING,
			value: this.getClippingAmount(STATUSES.DEMOLISH.id),
			why: <Trans id="mnk.demolish.suggestion.why">
				You lost {this.parser.formatDuration(clip[STATUSES.DEMOLISH.id] ?? 0)} of Demolish to early refreshes.
			</Trans>,
		}))
	}
}
