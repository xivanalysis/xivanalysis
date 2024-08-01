import {Trans} from '@lingui/react'
import {iconUrl} from 'data/icon'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const ICON_STARCROSS = 2078

export default class Procs extends CoreProcs {
	protected override showDroppedProcSuggestion = true
	// DRG wants to use every proc, and dropping any of them is a major issue
	protected override droppedProcIcon = iconUrl(ICON_STARCROSS)
	protected override droppedProcContent = <Trans id="drg.procs.suggestions.dropped.content">Avoid lettings your procs fall off without using them, ideally while buffed. This might not always be possible, so remember to at least use your procs before they fall off.</Trans>
	protected override droppedProcSeverityTiers = {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	}

	trackedProcs = [
		{
			procStatus: this.data.statuses.NASTROND_READY,
			consumeActions: [this.data.actions.NASTROND],
		},
		{
			procStatus: this.data.statuses.DIVE_READY,
			consumeActions: [this.data.actions.MIRAGE_DIVE],
		},
		{
			procStatus: this.data.statuses.DRAGONS_FLIGHT,
			consumeActions: [this.data.actions.RISE_OF_THE_DRAGON],
		},
		{
			procStatus: this.data.statuses.STARCROSS_READY,
			consumeActions: [this.data.actions.STARCROSS],
		},
	]

	// don't need job specific comment for mirage dive anymore, it just does damage and doesn't affect life offset
}
