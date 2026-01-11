import {Trans} from '@lingui/react/macro'
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

// HT requires 21s of uptime to break even with F4
const MINIMUM_THUNDER_UPTIME_ST = 21000
// HT2 requires 15s of uptime to break even with F4
const MINIMUM_THUNDER_UPTIME_AOE = 15000

export class DoTs extends CoreDoTs {

	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	protected override trackedStatuses = [
		this.data.statuses.HIGH_THUNDER.id,
		this.data.statuses.HIGH_THUNDER_II.id,
	]

	override initialise(): void {
		super.initialise()

		this.statusInvulnWarningDuration[this.data.statuses.HIGH_THUNDER.id] = this.data.statuses.HIGH_THUNDER.duration - MINIMUM_THUNDER_UPTIME_ST
		this.statusInvulnWarningDuration[this.data.statuses.HIGH_THUNDER_II.id] = this.data.statuses.HIGH_THUNDER_II.duration - MINIMUM_THUNDER_UPTIME_AOE
	}

	protected override addChecklistRules() {
		// Only tracking Thunder by way of DoTs override in 7.2+
		if (this.parser.patch.before('7.2')) { return }

		// Since BLM's DoTs are mutually-exclusive, adding their uptime percentages together paints the full picture of either of their uptime
		const cumulativeUptimePercent = this.getUptimePercent(this.data.statuses.HIGH_THUNDER.id) + this.getUptimePercent(this.data.statuses.HIGH_THUNDER_II.id)

		this.checklist.add(new Rule({
			name: THUNDER_CHECKLIST_NAME,
			description: THUNDER_CHECKLIST_DESCRIPTION,
			requirements: [
				new Requirement({
					name: THUNDER_REQUIREMENT_NAME,
					percent: cumulativeUptimePercent,
				}),
			],
		}))
	}

	protected addClippingSuggestions() {
		// Only tracking Thunder by way of DoTs override in 7.2+
		if (this.parser.patch.before('7.2')) { return }

		// Technically, with how Core DoTs works, this only tracks clipping by refreshing the same status effect, not when switching between the two
		// If I can ever make Core work with mutually-exclusive status effects and not have it devolve into insanity, we'll be ready for it here
		const clipPerMinute = this.getClippingAmount(this.data.statuses.HIGH_THUNDER.id) + this.getClippingAmount(this.data.statuses.HIGH_THUNDER_II.id)

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
