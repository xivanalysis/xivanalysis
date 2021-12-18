import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'
import {DoTs} from 'parser/core/modules/DoTs'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITIES = {
	UPTIME: {
		90: TARGET.WARN,
		95: TARGET.SUCCESS,
	},
	CLIPPING: {
		6000: SEVERITY.MINOR,
		9000: SEVERITY.MEDIUM,
		12000: SEVERITY.MAJOR,
	},
}

export class DeathsDesign extends DoTs {
	static override handle = 'design'

	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	override trackedStatuses = [
		this.data.statuses.DEATHS_DESIGN.id,
	]

	override addChecklistRules() {
		this.checklist.add(new TieredRule({
			name: <Trans id="rpr.design.rule.name">Keep <DataLink status="DEATHS_DESIGN"/> up</Trans>,
			description: <Trans id="rpr.design.rule.description">
				Death's Design increases all damage you deal to the target by 10%. Aim to keep this debuff up at all times.
			</Trans>,
			tiers: SEVERITIES.UPTIME,
			requirements: [
				new Requirement({
					name: <Trans id="rpr.design.requirement.uptime.name"><DataLink status="DEATHS_DESIGN"/> uptime</Trans>,
					percent: () => this.getUptimePercent(this.data.statuses.DEATHS_DESIGN.id),
				}),
			],
		}))
	}

	override addClippingSuggestions() {
		const clipPerMinute = this.getClippingAmount(this.data.statuses.DEATHS_DESIGN.id)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SHADOW_OF_DEATH.icon,
			content: <Trans id="rpr.design.suggestion.clip.content">
				Avoid refreshing <DataLink status="DEATHS_DESIGN" /> significantly before it expires.
			</Trans>,
			why: <Trans id="rpr.design.suggestion.clip.why">
				An average of {this.parser.formatDuration(clipPerMinute, 1)} seconds of <DataLink status="DEATHS_DESIGN"/> per minute lost to early refreshes.
			</Trans>,
			tiers: SEVERITIES.CLIPPING,
			value: clipPerMinute,
		}))
	}
}
