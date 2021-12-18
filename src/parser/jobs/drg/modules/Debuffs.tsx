import {Trans} from '@lingui/react'
import {ActionLink, DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import {DoTs as CoreDoTs} from 'parser/core/modules/DoTs'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export default class Debuffs extends CoreDoTs {
	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	override trackedStatuses = [
		this.data.statuses.CHAOTIC_SPRING.id,
	]

	addChecklistRules() {
		this.checklist.add(new Rule({
			name: <Trans id="drg.debuffs.checklist.name">Keep your debuffs up</Trans>,
			description: <Trans id="drg.debuffs.checklist.description">
				<ActionLink {...this.data.actions.CHAOTIC_SPRING} /> provides a potent DoT which should be maintained at all times.
			</Trans>,
			displayOrder: DISPLAY_ORDER.DEBUFFS,
			target: 90,
			requirements: [
				new Requirement({
					name: <Trans id="drg.debuffs.checklist.requirement.chaos-thrust.name"><ActionLink {...this.data.actions.CHAOTIC_SPRING} /> uptime</Trans>,
					percent: () => this.getUptimePercent(this.data.statuses.CHAOTIC_SPRING.id),
				}),
			],
		}))
	}

	addClippingSuggestions() {
		const chaosThrustClipPerMinute = this.getClippingAmount(this.data.statuses.CHAOTIC_SPRING.id)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.CHAOS_THRUST.icon,
			content: <Trans id="drg.debuffs.suggestions.clipping.content">
				Avoid refreshing <ActionLink {...this.data.actions.CHAOTIC_SPRING} /> significantly earlier or later than its expiration, as it usually indicates rotational errors. DRG's strict 10-GCD rotation should have you refreshing Chaos Thrust within 2 seconds before or after expiry, depending on your skill speed.
			</Trans>,
			tiers: {
				5000: SEVERITY.MINOR,
				10000: SEVERITY.MEDIUM,
				15000: SEVERITY.MAJOR,
			},
			value: chaosThrustClipPerMinute,
			why: <Trans id="drg.debuffs.suggestions.clipping.why">
				An average of {this.parser.formatDuration(chaosThrustClipPerMinute, 1)} seconds of <DataLink status="CHAOTIC_SPRING" /> per minute lost to early refreshes.
			</Trans>,
		}))
	}
}
