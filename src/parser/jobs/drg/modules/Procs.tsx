import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY} from 'parser/core/modules/Suggestions'

export default class Procs extends CoreProcs {
	protected override showDroppedProcSuggestion = true
	// DRG wants to use every proc, and dropping any of them is a major issue
	protected override droppedProcSeverityTiers = {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	}

	// we'll show invuln stuff too, though some of the drg actions are cleaves so will have to monitor for spurious suggestions
	protected override showInvulnProcSuggestion = true

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
