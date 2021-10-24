import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Module'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import {DoTs as CoreDoTs, DotDurations} from 'parser/core/modules/DoTs'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export default class Debuffs extends CoreDoTs {
	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	// When moving to Typescript, remember to mark this with override.
	override trackedStatuses = [
		this.data.statuses.CHAOS_THRUST.id,
	]

	addChecklistRules() {
		this.checklist.add(new Rule({
			name: <Trans id="drg.debuffs.checklist.name">Keep your debuffs up</Trans>,
			description: <Trans id="drg.debuffs.checklist.description">
				<ActionLink {...this.data.actions.CHAOS_THRUST} /> provides a potent DoT which should be maintained at all times.
			</Trans>,
			displayOrder: DISPLAY_ORDER.DEBUFFS,
			target: 90,
			requirements: [
				new Requirement({
					name: <Trans id="drg.debuffs.checklist.requirement.chaos-thrust.name"><ActionLink {...this.data.actions.CHAOS_THRUST} /> uptime</Trans>,
					percent: () => this.getUptimePercent(this.data.statuses.CHAOS_THRUST.id),
				}),
			],
		}))
	}

	addClippingSuggestions(clip: DotDurations) {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.CHAOS_THRUST.icon,
			content: <Trans id="drg.debuffs.suggestions.clipping.content">
				Avoid refreshing <ActionLink {...this.data.actions.CHAOS_THRUST} /> significantly earlier or later than its expiration, as it usually indicates rotational errors. DRG's strict 10-GCD rotation should have you refreshing Chaos Thrust within 2 seconds before or after expiry, depending on your skill speed.
			</Trans>,
			tiers: {
				5: SEVERITY.MINOR,
				10: SEVERITY.MEDIUM,
				15: SEVERITY.MAJOR,
			},
			value: this.getClippingAmount(this.data.statuses.CHAOS_THRUST.id),
			why: <Trans id="drg.debuffs.suggestions.clipping.why">
				You lost {this.parser.formatDuration(clip[this.data.statuses.CHAOS_THRUST.id] ?? 0)} of Chaos Thrust to early refreshes.
			</Trans>,
		}))
	}
}
