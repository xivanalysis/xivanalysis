import {Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'
import {DoTs as CoreDoTs} from 'parser/core/modules/DoTs'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

// 5.x: Bard clips 10s every 80s rotationally
// 6.x: bard clips ~15s every 120s rotationally
const SEVERITIES = {
	CLIPPING: {
		10: SEVERITY.MEDIUM,
		15: SEVERITY.MAJOR,
	},
	UPTIME: {
		85: TARGET.WARN,
		95: TARGET.SUCCESS,
	},
}

export class DoTs extends CoreDoTs {
	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	protected override trackedStatuses = [
		this.data.statuses.CAUSTIC_BITE.id,
		this.data.statuses.STORMBITE.id,
	]

	protected override addChecklistRules() {
		this.checklist.add(new TieredRule({
			name: <Trans id="brd.dots.checklist.name">Keep your DoTs up</Trans>,
			description: <Trans id="brd.dots.checklist.description">Most of Bard's DPS comes either directly or indirectly from <ActionLink {...this.data.actions.CAUSTIC_BITE}/> and <ActionLink {...this.data.actions.STORMBITE}/>.
				Make sure you have these skills applied on the target at all times. Use <ActionLink {...this.data.actions.IRON_JAWS}/> to refresh the timer on the Damage over Time (DoT) debuff.
			</Trans>,
			tiers: SEVERITIES.UPTIME,
			requirements: [
				new Requirement({
					name: <Trans id="brd.dots.checklist.requirement.caustic"><StatusLink {...this.data.statuses.CAUSTIC_BITE} /> uptime</Trans>,
					percent: () => this.getUptimePercent(this.data.statuses.CAUSTIC_BITE.id),
				}),
				new Requirement({
					name: <Trans id="brd.dots.checklist.requirement.storm"><StatusLink {...this.data.statuses.STORMBITE} /> uptime</Trans>,
					percent: () => this.getUptimePercent(this.data.statuses.STORMBITE.id),
				}),
			],
		}))
	}

	protected addClippingSuggestions() {
		// DoTs are meant to be refreshed together, so just average their clip
		const meanClip = (this.getClippingAmount(this.data.statuses.CAUSTIC_BITE.id) + this.getClippingAmount(this.data.statuses.STORMBITE.id)) / 2

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.IRON_JAWS.icon,
			content: <Trans id="brd.dots.suggestion.clip.content">
					Avoid refreshing <ActionLink {...this.data.actions.CAUSTIC_BITE} /> and <ActionLink {...this.data.actions.STORMBITE} /> significantly before they expire.
			</Trans>,
			why: <Trans id="brd.dots.suggestion.clip.why">
						An average of {this.parser.formatDuration(meanClip)} of DoTs clipped every minute.
			</Trans>,
			tiers: SEVERITIES.CLIPPING,
			value: meanClip,
		}))
	}
}
