import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import React from 'react'

export class Continuation extends CoreProcs { //Also Lion Heart I guess
	override trackedProcs = [
		{
			procStatus: this.data.statuses.READY_TO_RIP,
			consumeActions: [this.data.actions.JUGULAR_RIP],
		},
		{
			procStatus: this.data.statuses.READY_TO_TEAR,
			consumeActions: [this.data.actions.ABDOMEN_TEAR],
		},
		{
			procStatus: this.data.statuses.READY_TO_GOUGE,
			consumeActions: [this.data.actions.EYE_GOUGE],
		},
		{
			procStatus: this.data.statuses.READY_TO_BLAST,
			consumeActions: [this.data.actions.HYPERVELOCITY],
		},
		{
			procStatus: this.data.statuses.READY_TO_RAZE,
			consumeActions: [this.data.actions.FATED_BRAND],
		},
		{
			procStatus: this.data.statuses.READY_TO_REIGN,
			consumeActions: [this.data.actions.REIGN_OF_BEASTS],
		},
	]

	override showDroppedProcSuggestion = true
	override droppedProcIcon = this.data.actions.CONTINUATION.icon
	override droppedProcContent =
		<Trans id="gnb.continuation.suggestions.drops.content">
			Avoid dropping your <DataLink action="CONTINUATION"/> procs. They are a significant portion of your damage and should be used as soon as possible.
		</Trans>
}
