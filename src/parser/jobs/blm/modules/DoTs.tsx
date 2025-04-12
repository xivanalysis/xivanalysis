import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {Checklist, Requirement, Rule} from 'parser/core/modules/Checklist'
import {DoTs as CoreDoTs} from 'parser/core/modules/DoTs'
import {Suggestions, SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {THUNDER_CHECKLIST_DESCRIPTION, THUNDER_CHECKLIST_NAME, THUNDER_REQUIREMENT_NAME} from './DoTsCommon'

const SEVERITIES = {
	CLIPPING: {
		6000: SEVERITY.MINOR,
		9000: SEVERITY.MEDIUM,
		12000: SEVERITY.MAJOR,
	},
}

export class DoTs extends CoreDoTs {

	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	private thunderStatusId = this.data.statuses.HIGH_THUNDER.id

	protected override trackedStatuses = [
		this.thunderStatusId,
	]

	protected override addChecklistRules() {
		// Only tracking Thunder by way of DoTs override in 7.2+
		if (this.parser.patch.before('7.2')) { return }

		this.checklist.add(new Rule({
			name: THUNDER_CHECKLIST_NAME,
			description: THUNDER_CHECKLIST_DESCRIPTION,
			requirements: [
				new Requirement({
					name: THUNDER_REQUIREMENT_NAME,
					percent: this.getUptimePercent(this.thunderStatusId),
				}),
			],
		}))
	}

	protected addClippingSuggestions() {
		// Only tracking Thunder by way of DoTs override in 7.2+
		if (this.parser.patch.before('7.2')) { return }

		const clipPerMinute = this.getClippingAmount(this.thunderStatusId)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.HIGH_THUNDER.icon,
			content: <Trans id="blm.dots.suggestion.clip.content">
				Casting <DataLink action="HIGH_THUNDER" /> too frequently can cause you to lose DPS by casting fewer <DataLink action="FIRE_IV" />. Try not to cast <DataLink showIcon={false} action="HIGH_THUNDER" /> unless your <DataLink showIcon={false} status="HIGH_THUNDER" /> DoT is about to wear off.
			</Trans>,
			why: <Trans id="blm.dots.suggestion.clip.why">
				An average of {this.parser.formatDuration(clipPerMinute, 1)} seconds of <DataLink status="HIGH_THUNDER" /> clipped per minute due to early refreshes.
			</Trans>,
			tiers: SEVERITIES.CLIPPING,
			value: clipPerMinute,
		}))
	}
}
