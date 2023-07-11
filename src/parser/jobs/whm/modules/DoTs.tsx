import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'
import {DoTs as CoreDoTs} from 'parser/core/modules/DoTs'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITIES = {
	// Clipping warnings in seconds per minute
	CLIPPING: {
		6000: SEVERITY.MINOR,
		9000: SEVERITY.MEDIUM,
		12000: SEVERITY.MAJOR,
	},
	UPTIME: {
		90: TARGET.WARN,
		95: TARGET.SUCCESS,
	},
}

export class DoTs extends CoreDoTs {
	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	protected override trackedStatuses = [
		this.data.statuses.DIA.id,
	]

	protected override addChecklistRules() {
		const uptimePercent = this.getUptimePercent(this.data.statuses.DIA.id)
		this.checklist.add(new TieredRule({
			name: <Trans id="whm.dots.rule.name">Keep your DoTs up </Trans>,
			description: <Trans id="whm.dots.rule.description">
				As a White Mage, <DataLink status="DIA" showIcon={false} showTooltip={false} /> is significant portion of your sustained damage. Aim to keep it up at all times.
			</Trans>,
			tiers: SEVERITIES.UPTIME,
			requirements: [
				new Requirement({
					name: <Trans id="whm.dots.requirement.uptime-dia.name"><DataLink status="DIA" /> uptime</Trans>,
					percent: uptimePercent,
				}),
			],
		}))
	}

	protected addClippingSuggestions() {
		const clippingPerMinute = this.getClippingAmount(this.data.statuses.DIA.id)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.DIA.icon,
			content: <Trans id="whm.dots.suggestion.clip-dia.content">
				Avoid refreshing Dia significantly before its expiration, this will allow you to cast more Glares.
			</Trans>,
			tiers: SEVERITIES.CLIPPING,
			value: clippingPerMinute,
			why: <Trans id="whm.dots.suggestion.clip-dia.why">
				An average of {this.parser.formatDuration(clippingPerMinute)} of <DataLink status="DIA" /> clipped per minute due to early refreshes.
			</Trans>,
		}))
	}
}
