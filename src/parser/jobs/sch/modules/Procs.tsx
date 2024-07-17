import {Trans, Plural} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Procs as CoreProcs, ProcGroup} from 'parser/core/modules/Procs'
import {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

export default class Procs extends CoreProcs {
	protected override trackedProcs: ProcGroup[] = [
		{
			procStatus: this.data.statuses.IMPACT_IMMINENT,
			consumeActions: [
				this.data.actions.BANEFUL_IMPACTION,
			],
		},
	]

	protected override addJobSpecificSuggestions(): void {
		const droppedImpacts: number = this.getDropCountForStatus(this.data.statuses.IMPACT_IMMINENT.id)
		if (droppedImpacts > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.BANEFUL_IMPACTION.icon,
				content: <Trans id="sch.procs.suggestions.missed-impacts.content">You should always use <ActionLink {...this.data.actions.BANEFUL_IMPACTION} /> before <StatusLink {...this.data.statuses.IMPACT_IMMINENT} /> expires.</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="sch.procs.suggestions.missed-impacts.why">
					<Plural value={droppedImpacts} one="# proc" other="# procs" /> expired.
				</Trans>,
			}))
		}
	}
}
