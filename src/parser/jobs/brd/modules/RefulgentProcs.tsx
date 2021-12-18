import {Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Procs} from 'parser/core/modules/Procs'
import React from 'react'

export class RefulgentProcs extends Procs {
	override trackedProcs = [
		{
			procStatus: this.data.statuses.STRAIGHT_SHOT_READY,
			consumeActions: [this.data.actions.REFULGENT_ARROW],
		},
	]

	override showDroppedProcSuggestion = true
	override droppedProcIcon = this.data.actions.REFULGENT_ARROW.icon
	override droppedProcContent = <Trans id="brd.procs.suggestions.missed.content">
		Try to use <ActionLink {...this.data.actions.REFULGENT_ARROW} /> whenever you have <StatusLink {...this.data.statuses.STRAIGHT_SHOT_READY} />.
	</Trans>

	override showOverwroteProcSuggestion = true
	override overwroteProcIcon = this.data.actions.REFULGENT_ARROW.icon
	override overwroteProcContent = <Trans id="brd.procs.suggestions.overwritten.content">
		Avoid using actions that grant <StatusLink {...this.data.statuses.STRAIGHT_SHOT_READY} /> when you
		could use <ActionLink {...this.data.actions.REFULGENT_ARROW} /> instead.
	</Trans>
}
