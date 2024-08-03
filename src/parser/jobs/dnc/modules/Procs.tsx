import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import React from 'react'

export class Procs extends CoreProcs {
	override trackedProcs = [
		{
			procStatus: this.data.statuses.THREEFOLD_FAN_DANCE,
			consumeActions: [this.data.actions.FAN_DANCE_III],
		},
		{
			procStatus: this.data.statuses.FOURFOLD_FAN_DANCE,
			consumeActions: [this.data.actions.FAN_DANCE_IV],
		},
		{
			procStatus: this.data.statuses.SILKEN_SYMMETRY,
			consumeActions: [this.data.actions.REVERSE_CASCADE, this.data.actions.RISING_WINDMILL],
		},
		{
			procStatus: this.data.statuses.SILKEN_FLOW,
			consumeActions: [this.data.actions.FOUNTAINFALL, this.data.actions.BLOODSHOWER],
		},
		{
			procStatus: this.data.statuses.FLOURISHING_SYMMETRY,
			consumeActions: [this.data.actions.REVERSE_CASCADE, this.data.actions.RISING_WINDMILL],
		},
		{
			procStatus: this.data.statuses.FLOURISHING_FLOW,
			consumeActions: [this.data.actions.FOUNTAINFALL, this.data.actions.BLOODSHOWER],
		},
		{
			procStatus: this.data.statuses.FLOURISHING_STARFALL,
			consumeActions: [this.data.actions.STARFALL_DANCE],
		},
		{
			procStatus: this.data.statuses.FLOURISHING_FINISH,
			consumeActions: [this.data.actions.TILLANA],
		},
	]

	override showDroppedProcSuggestion = true
	override showProcIssueOutput = true
	override droppedProcIcon = this.data.actions.FOUNTAINFALL.icon
	override droppedProcContent =
		<Trans id="dnc.procs.suggestions.drops.content">
			Avoid dropping your procs unless absolutely necessary. If you have to drop one to keep your Esprit from overcapping, <DataLink status="SILKEN_SYMMETRY"/> or <DataLink status="FLOURISHING_SYMMETRY"/> will lose the least DPS overall.
		</Trans>

	override showOverwroteProcSuggestion = true
	override overwroteProcIcon = this.data.actions.REVERSE_CASCADE.icon
	override overwroteProcContent =
		<Trans id="dnc.procs.suggestions.overwrite.content">
			Avoid overwriting your procs. Your proc actions are stronger than your normal combo, so overwriting them is a significant DPS loss.
		</Trans>
}
