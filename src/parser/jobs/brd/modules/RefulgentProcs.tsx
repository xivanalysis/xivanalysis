import {Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Procs} from 'parser/core/modules/Procs'
import React from 'react'

export default class RefulgentProcs extends Procs {
	trackedProcs = [
		{
			procStatus: this.data.statuses.STRAIGHT_SHOT_READY,
			consumeActions: [this.data.actions.REFULGENT_ARROW],
		},
	]

	showDroppedProcSuggestion = true
	droppedProcIcon = this.data.actions.REFULGENT_ARROW.icon
	droppedProcContent = <Trans id="brd.procs.suggestions.missed.content">
		Try to use <ActionLink {...this.data.actions.REFULGENT_ARROW} /> whenever you have <StatusLink {...this.data.statuses.STRAIGHT_SHOT_READY} />.
	</Trans>

	showOverwroteProcSuggestion = true
	overwroteProcIcon = this.data.actions.REFULGENT_ARROW.icon
	overwroteProcContent = <Trans id="brd.procs.suggestions.overwritten.content">
		Avoid using actions that grant <StatusLink {...this.data.statuses.STRAIGHT_SHOT_READY} /> when you
		could use <ActionLink {...this.data.actions.REFULGENT_ARROW} /> instead.
	</Trans>
}
