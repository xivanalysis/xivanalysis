import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'
import {DoTs as CoreDoTs} from 'parser/core/modules/DoTs'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITIES = {
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
		this.data.statuses.EUKRASIAN_DOSIS_III.id,
	]

	protected override addChecklistRules() {
		this.checklist.add(new TieredRule({
			name: <Trans id="sge.dots.rule.name">Keep your DoT up</Trans>,
			description: <Trans id="sge.dots.rule.description">
				<DataLink status="EUKRASIAN_DOSIS_III" showIcon={false} showTooltip={false} /> makes up a good portion of your damage. Aim to keep this DoT up at all times. It can also be used to weave your Addersgall abilities or other cooldowns, or maneuver around without dropping GCD uptime.
			</Trans>,
			tiers: SEVERITIES.UPTIME,
			requirements: [
				new Requirement({
					name: <Trans id="sge.dots.requirement.uptime.name"><DataLink status="EUKRASIAN_DOSIS_III" /> uptime</Trans>,
					percent: () => this.getUptimePercent(this.data.statuses.EUKRASIAN_DOSIS_III.id),
				}),
			],
		}))
	}

	protected addClippingSuggestions() {
		const dosisClipPerMinute = this.getClippingAmount(this.data.statuses.EUKRASIAN_DOSIS_III.id)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.EUKRASIAN_DOSIS_III.icon,
			content: <Trans id="sge.dots.suggestion.clip.content">
				Avoid refreshing <DataLink status="EUKRASIAN_DOSIS_III" /> significantly before it expires.
			</Trans>,
			why: <Trans id="sge.dots.suggestion.clip.why">
				An average of {this.parser.formatDuration(dosisClipPerMinute, 1)} seconds of <DataLink status="EUKRASIAN_DOSIS_III" /> per minute lost to early refreshes.
			</Trans>,
			tiers: SEVERITIES.CLIPPING,
			value: dosisClipPerMinute,
		}))
	}
}
