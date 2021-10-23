import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import React from 'react'

export class Procs extends CoreProcs {
	override trackedProcs = [
		{
			procStatus: this.data.statuses.FLOURISHING_FAN_DANCE,
			consumeActions: [this.data.actions.FAN_DANCE_III],
		},
		{
			procStatus: this.data.statuses.FLOURISHING_CASCADE,
			consumeActions: [this.data.actions.REVERSE_CASCADE],
		},
		{
			procStatus: this.data.statuses.FLOURISHING_FOUNTAIN,
			consumeActions: [this.data.actions.FOUNTAINFALL],
		},
		{
			procStatus: this.data.statuses.FLOURISHING_SHOWER,
			consumeActions: [this.data.actions.BLOODSHOWER],
		},
		{
			procStatus: this.data.statuses.FLOURISHING_WINDMILL,
			consumeActions: [this.data.actions.RISING_WINDMILL],
		},
	]

	override showDroppedProcSuggestion = true
	override droppedProcIcon = this.data.actions.FOUNTAINFALL.icon
	override droppedProcContent =
		<Trans id="dnc.procs.suggestions.drops.content">
			Avoid dropping your procs unless absolutely necessary. If you have to drop one to keep your Esprit from overcapping, <ActionLink {...this.data.actions.RISING_WINDMILL} /> or <ActionLink {...this.data.actions.REVERSE_CASCADE} /> will lose the least DPS overall.
		</Trans>

	override showOverwroteProcSuggestion = true
	override overwroteProcIcon = this.data.actions.REVERSE_CASCADE.icon
	override overwroteProcContent =
		<Trans id="dnc.procs.suggestions.overwrite.content">
			Avoid overwriting your procs. Your proc actions are stronger than your normal combo, so overwriting them is a significant DPS loss.
		</Trans>
}
