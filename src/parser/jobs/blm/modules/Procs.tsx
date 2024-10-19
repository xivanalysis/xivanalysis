import {Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Events} from 'event'
import {dependency} from 'parser/core/Injectable'
import CastTime from 'parser/core/modules/CastTime'
import {ProcGroup, Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

export default class Procs extends CoreProcs {
	@dependency castTime!: CastTime

	override trackedProcs = [
		{
			procStatus: this.data.statuses.THUNDERHEAD,
			consumeActions: [
				this.data.actions.THUNDER_III,
				this.data.actions.THUNDER_IV,
				this.data.actions.HIGH_THUNDER,
				this.data.actions.HIGH_THUNDER_II,
			],
			mayOverwrite: true,
		},
		{
			procStatus: this.data.statuses.FIRESTARTER,
			consumeActions: [this.data.actions.FIRE_III],
		},
	]
	override showProcIssueOutput = true

	protected override jobSpecificOnConsumeProc(procGroup: ProcGroup, event: Events['action']): void {
		// Thunder spells are already instant in Dawntrail, their casting is just enabled by the status
		if (procGroup.procStatus !== this.data.statuses.FIRESTARTER) { return }

		// Firestarter makes Fire III instant-cast
		this.castTime.setInstantCastAdjustment([event.action], event.timestamp, event.timestamp)
	}

	protected override addJobSpecificSuggestions(): void {
		const droppedThunderHeads: number = this.getDropCountForStatus(this.data.statuses.THUNDERHEAD.id)
		if (droppedThunderHeads > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.statuses.THUNDERHEAD.icon,
				content: <Trans id="blm.procs.suggestions.dropped-thunderheads.content">
					You lost at least one <ActionLink {...this.data.actions.HIGH_THUNDER}/> proc by allowing <StatusLink {...this.data.statuses.THUNDERHEAD}/> to expire without using it.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="blm.procs.suggestions.dropped-thunderheads.why">
					<Plural value={droppedThunderHeads} one="# Thunderhead" other="# Thunderheads" /> expired.
				</Trans>,
			}))
		}

		const droppedFireStarters: number = this.getDropCountForStatus(this.data.statuses.FIRESTARTER.id)
		if (droppedFireStarters > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.statuses.FIRESTARTER.icon,
				content: <Trans id="blm.procs.suggestions.dropped-f3ps.content">
					You lost at least  one <ActionLink {...this.data.actions.FIRE_III}/> proc by allowing <StatusLink {...this.data.statuses.FIRESTARTER}/> to expire without using it.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="blm.procs.suggestions.dropped-f3ps.why">
					<Plural value={droppedFireStarters} one="# Firestarter proc" other="# Firestarter procs" /> expired.
				</Trans>,
			}))
		}
	}
}
