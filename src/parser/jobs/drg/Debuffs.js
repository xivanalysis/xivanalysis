import {Trans} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import DoTs from 'parser/core/modules/DoTs'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export default class Debuffs extends DoTs {
	static dependencies = [
		...DoTs.dependencies,
		'checklist',
		'suggestions',
	]

	static statusesToTrack = [
		STATUSES.PIERCING_RESISTANCE_DOWN.id,
		STATUSES.CHAOS_THRUST.id,
	]

	addChecklistRules() {
		this.checklist.add(new Rule({
			name: <Trans id="drg.debuffs.checklist.name">Keep your debuffs up</Trans>,
			description: <Trans id="drg.debuffs.checklist.description">
				<ActionLink {...ACTIONS.DISEMBOWEL}/> and <ActionLink {...ACTIONS.CHAOS_THRUST}/> provide an important piercing vulnerability debuff and a potent DoT respectively, both of which should be maintained at all times.
			</Trans>,
			displayOrder: DISPLAY_ORDER.DEBUFFS,
			requirements: [
				new Requirement({
					name: <Trans id="drg.debuffs.checklist.requirement.disembowel.name"><ActionLink {...ACTIONS.DISEMBOWEL}/> uptime</Trans>,
					percent: () => this.getUptimePercent(STATUSES.PIERCING_RESISTANCE_DOWN.id),
				}),
				new Requirement({
					name: <Trans id="drg.debuffs.checklist.requirement.chaos-thrust.name"><ActionLink {...ACTIONS.CHAOS_THRUST}/> uptime</Trans>,
					percent: () => this.getUptimePercent(STATUSES.CHAOS_THRUST.id),
				}),
			],
		}))
	}

	addClippingSuggestions(clip) {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.CHAOS_THRUST.icon,
			content: <Trans id="drg.debuffs.suggestions.clipping.content">
				Avoid refreshing <ActionLink {...ACTIONS.CHAOS_THRUST}/> significantly before its expiration, as it usually indicates rotational errors. DRG's strict 11-GCD rotation should have you refreshing Chaos Thrust with 1-2 seconds remaining, depending on your skill speed.
			</Trans>,
			tiers: {
				5: SEVERITY.MINOR,
				10: SEVERITY.MEDIUM,
				15: SEVERITY.MAJOR,
			},
			value: this.getClippingAmount(STATUSES.CHAOS_THRUST.id),
			why: <Trans id="drg.debuffs.suggestions.clipping.why">
				You lost {this.parser.formatDuration(clip[STATUSES.CHAOS_THRUST.id])} of Chaos Thrust to early refreshes.
			</Trans>,
		}))
	}
}
