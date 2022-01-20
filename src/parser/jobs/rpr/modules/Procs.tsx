import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

// these values may need to be changed in future.
const SEVERITIES = {
	EXPIRED: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
	OVERWRITTEN: {
		1: SEVERITY.MINOR,
		5: SEVERITY.MEDIUM,
	},
}

//potency loss due to not using any one proc, enshrouded or reaver.
const LOST_PROC_POTENCY = 60

export class Procs extends CoreProcs {
	static override title = t('rpr.enhanced-gibbet-gallows.title')`Incorrect Soul Reaver Usage`

	trackedProcs = [
		{
			procStatus: this.data.statuses.ENHANCED_GIBBET,
			consumeActions: [this.data.actions.GIBBET],
		},
		{
			procStatus: this.data.statuses.ENHANCED_GALLOWS,
			consumeActions: [this.data.actions.GALLOWS],
		},
		{
			procStatus: this.data.statuses.ENHANCED_VOID_REAPING,
			consumeActions: [this.data.actions.VOID_REAPING],
		},
		{
			procStatus: this.data.statuses.ENHANCED_CROSS_REAPING,
			consumeActions: [this.data.actions.CROSS_REAPING],
		},
	]
	//TODO: rewrite addJobSpecificSuggestions()
	protected override addJobSpecificSuggestions() {
		//TODO: Overwritten Gibbet
		//TODO: Overwritten Gallows
		//TODO: Overwritten Void Reaping
		//TODO: Overwritten Cross Reaping
		//TODO: Expired Gibbet
		//TODO: Expired Gallows
		//TODO: Expired Cross Reaping
		//TODO: Expired Void Reaping
	}
}
