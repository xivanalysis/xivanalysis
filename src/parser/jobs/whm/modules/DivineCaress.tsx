import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

export class DivineCaress extends CoreProcs {
	static override handle = 'divinecaresstracker'

	//Track Divine Caress as the only status currently
	override trackedProcs = [
		{
			procStatus: this.data.statuses.DIVINE_GRACE,
			consumeActions: [this.data.actions.DIVINE_CARESS],
		},
	]
	override showDroppedProcSuggestion = true;
	override droppedProcIcon = this.data.actions.DIVINE_CARESS.icon;
	override droppedProcContent =
		<Trans id="whm.procs.suggestions.dropped-divine-caress.content">
			Try to use <DataLink action="DIVINE_CARESS"/> whenever you have used <DataLink action="TEMPERANCE"/>. It is a free, groupwide oGCD shield and heal over time!
		</Trans>
	override droppedProcSeverityTiers = {
		1: SEVERITY.MEDIUM,
		3: SEVERITY.MAJOR,
	}
}
