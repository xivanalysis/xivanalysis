import {Trans} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import DoTs from 'parser/core/modules/DoTs'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export default class ShadowFang extends DoTs {
	static dependencies = [
		...DoTs.dependencies,
		'checklist',
		'suggestions',
	]

	static statusesToTrack = [
		STATUSES.SHADOW_FANG.id,
	]

	addChecklistRules() {
		this.checklist.add(new Rule({
			name: <Trans id="nin.shadowfang.checklist.name">Keep Shadow Fang up</Trans>,
			description: <Trans id="nin.shadowfang.checklist.description">
				<ActionLink {...ACTIONS.SHADOW_FANG}/> is your strongest combo finisher (assuming at least 5 DoT ticks hit) and should be maintained at all times.
			</Trans>,
			displayOrder: DISPLAY_ORDER.SHADOW_FANG,
			requirements: [
				new Requirement({
					name: <Trans id="nin.shadowfang.checklist.requirement.name"><ActionLink {...ACTIONS.SHADOW_FANG}/> uptime</Trans>,
					percent: () => this.getUptimePercent(STATUSES.SHADOW_FANG.id),
				}),
			],
		}))
	}

	addClippingSuggestions(clip) {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SHADOW_FANG.icon,
			content: <Trans id="nin.shadowfang.suggestions.clipping.content">
				Avoid refreshing <ActionLink {...ACTIONS.SHADOW_FANG}/> significantly before its expiration, unless it would otherwise cost you significant uptime. Unnecessary refreshes risk overwriting buff snapshots and reduce the number of times you can use <ActionLink {...ACTIONS.AEOLIAN_EDGE}/>.
			</Trans>,
			tiers: {
				7: SEVERITY.MINOR,
				10: SEVERITY.MEDIUM,
				15: SEVERITY.MAJOR,
			},
			value: this.getClippingAmount(STATUSES.SHADOW_FANG.id),
			why: <Trans id="nin.shadowfang.suggestions.clipping.why">
				You lost {this.parser.formatDuration(clip[STATUSES.SHADOW_FANG.id] ?? 0)} of Shadow Fang to early refreshes.
			</Trans>,
		}))
	}
}
