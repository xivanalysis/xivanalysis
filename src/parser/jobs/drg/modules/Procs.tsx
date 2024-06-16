import {Procs as CoreProcs} from 'parser/core/modules/Procs'

export default class Procs extends CoreProcs {
	// Nastrond is technically a status that could be tracked here, but it's probably more useful to highlight
	// it in a suggestion tied to the life of the dragon window
	trackedProcs = [
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
