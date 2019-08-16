import React from 'react'

import {Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import CoreDoTs from 'parser/core/modules/DoTs'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import DISPLAY_ORDER from './DISPLAY_ORDER'

// In seconds
const CLIPPING_SEVERITY = {
	6: SEVERITY.MINOR,
	9: SEVERITY.MEDIUM,
	12: SEVERITY.MAJOR,
}

export default class DoTs extends CoreDoTs {
	static handle = 'dots'
	static displayOrder = DISPLAY_ORDER.DOTS
	static dependencies = [
		...DoTs.dependencies,
		'checklist',
		'suggestions',
	]

	static statusesToTrack = [
		STATUSES.BIOLYSIS.id,
	]

	addChecklistRules() {
		this.checklist.add(new Rule({
			name: <Trans id="sch.dots.checklist.name">Keep your DoTs up</Trans>,
			description: <Trans id="sch.dots.checklist.description">
				As a Scholar, DoTs are a significant portion of your sustained damage. Aim to keep them up at all times.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="sch.dots.checklist.requirement.bio-ii.name"><ActionLink {...ACTIONS.BIOLYSIS} /> uptime</Trans>,
					percent: () => this.getUptimePercent(STATUSES.BIOLYSIS.id),
				}),
			],
		}))
	}

	addClippingSuggestions(clip) {
		const clipPerMinute = this.getClippingAmount(STATUSES.BIOLYSIS.id)
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.BIOLYSIS.icon,
			content: <Trans id="sch.dots.suggestions.clipping.content">
				Avoid refreshing Biolysis significantly before its expiration, except when at the end of the fight. Unnecessary refreshes use up your mana more than necessary, and may cause you to go out of mana.
			</Trans>,
			tiers: CLIPPING_SEVERITY,
			value: clipPerMinute,
			why: <Trans id="sch.dots.suggestions.clipping.why">
				{this.parser.formatDuration(clip[STATUSES.BIOLYSIS.id])} of <StatusLink {...STATUSES.BIOLYSIS}/> lost to early refreshes.
			</Trans>,
		}))
	}
}

