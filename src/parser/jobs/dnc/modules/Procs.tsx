import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import React from 'react'

export default class Procs extends CoreProcs {
	trackedProcs = [
		{
			procStatus: STATUSES.FLOURISHING_FAN_DANCE,
			consumeActions: [ACTIONS.FAN_DANCE_III],
		},
		{
			procStatus: STATUSES.FLOURISHING_CASCADE,
			consumeActions: [ACTIONS.REVERSE_CASCADE],
		},
		{
			procStatus: STATUSES.FLOURISHING_FOUNTAIN,
			consumeActions: [ACTIONS.FOUNTAINFALL],
		},
		{
			procStatus: STATUSES.FLOURISHING_SHOWER,
			consumeActions: [ACTIONS.BLOODSHOWER],
		},
		{
			procStatus: STATUSES.FLOURISHING_WINDMILL,
			consumeActions: [ACTIONS.RISING_WINDMILL],
		},
	]

	showDroppedProcSuggestion = true
	droppedProcIcon = ACTIONS.FOUNTAINFALL.icon
	droppedProcContent =
		<Trans id="dnc.procs.suggestions.drops.content">
			Avoid dropping your procs unless absolutely necessary. If you have to drop one to keep your Esprit from overcapping, <ActionLink {...ACTIONS.RISING_WINDMILL} /> or <ActionLink {...ACTIONS.REVERSE_CASCADE} /> will lose the least DPS overall.
		</Trans>

	showOverwroteProcSuggestion = true
	overwroteProcIcon = ACTIONS.REVERSE_CASCADE.icon
	overwroteProcContent =
		<Trans id="dnc.procs.suggestions.overwrite.content">
			Avoid overwriting your procs. Your proc actions are stronger than your normal combo, so overwriting them is a significant DPS loss.
		</Trans>
}
