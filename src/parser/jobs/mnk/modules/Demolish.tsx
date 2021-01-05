import {Trans} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import STATUSES from 'data/STATUSES'

import {dependency} from 'parser/core/Module'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
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
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	addChecklistRules() {
		this.checklist.add(new Rule({
			name: <Trans id="mnk.demolish.checklist.name">Keep Demolish up</Trans>,
			description: <Trans id="mnk.demolish.checklist.description">
				<ActionLink {...this.data.actions.DEMOLISH}/> is your strongest finisher (assuming at least 3 DoT ticks hit).
			</Trans>,
			displayOrder: DISPLAY_ORDER.DEMOLISH,
			requirements: [
				new Requirement({
					name: <Trans id="mnk.demolish.checklist.requirement.name"><ActionLink {...this.data.actions.DEMOLISH}/> uptime</Trans>,
					percent: () => this.getUptimePercent(this.data.statuses.DEMOLISH.id),
				}),
			],
			// TODO: calculate the number of good Demolishes a fight should have
			//       and set target to allow dropping without losing a tick
			target: 85,
		}))
	}

	addClippingSuggestions(clip: TODO) {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.DEMOLISH.icon,
			content: <Trans id="mnk.demolish.suggestion.content">
				Avoid refreshing <ActionLink {...this.data.actions.DEMOLISH}/> significantly before its expiration. Unnecessary refreshes risk overwriting buff snapshots.
			</Trans>,
			tiers: SEVERITIES.CLIPPING,
			value: this.getClippingAmount(this.data.statuses.DEMOLISH.id),
			why: <Trans id="mnk.demolish.suggestion.why">
				You lost {this.parser.formatDuration(clip[this.data.statuses.DEMOLISH.id] ?? 0)} of Demolish to early refreshes.
			</Trans>,
		}))
	}
}
