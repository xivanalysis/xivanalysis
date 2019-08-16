import React from 'react'

import {Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import CoreDoTs from 'parser/core/modules/DoTs'
import {TieredRule, TARGET, Requirement} from 'parser/core/modules/Checklist'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import DISPLAY_ORDER from './DISPLAY_ORDER'

// In seconds
const SEVERITIES = {
	CLIPPING: {
		6: SEVERITY.MINOR,
		9: SEVERITY.MEDIUM,
		12: SEVERITY.MAJOR,
	},
	UPTIME: {
		84: TARGET.WARN,
		94: TARGET.SUCCESS,
	},
}

export default class DoTs extends CoreDoTs {
	static handle = 'biolysis'
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
		this.checklist.add(new TieredRule({
			name: <Trans id="sch.dots.checklist.name">Keep your DoT up</Trans>,
			description: <Trans id="sch.dots.checklist.description">
				As a Scholar, Biolysis is a notable porition of your damage. Aim to keep it up as much as possible, so long as you can get at least 15 seconds of uptime per application.
			</Trans>,
			tiers: SEVERITIES.UPTIME,
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
			tiers: SEVERITIES.CLIPPING,
			value: clipPerMinute,
			why: <Trans id="sch.dots.suggestions.clipping.why">
				An average of {this.parser.formatDuration(clipPerMinute * 1000)} of <StatusLink {...STATUSES.BIOLYSIS}/> clipped every minute, for a total of {this.parser.formatDuration(clip[STATUSES.BIOLYSIS.id])} lost to early refreshes.
			</Trans>,
		}))
	}
}

