import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

export class GlareFlare extends CoreProcs {
	static override handle = 'glareflare'
	override trackedProcs = [
		{
			procStatus: this.data.statuses.SACRED_SIGHT,
			consumeActions: [this.data.actions.GLARE_IV],
		},
	]
	override showDroppedProcSuggestion = true;
	override droppedProcIcon = this.data.actions.GLARE_IV.icon;
	override droppedProcContent =
		<Trans id="whm.procs.suggestions.dropped-glare-iv.content">
			Make sure to use all three <DataLink action="GLARE_IV" /> procs after using <DataLink action="PRESENCE_OF_MIND"/>. It is your best offensive skill to use for the thirty second buff duration.
		</Trans>
	override droppedProcSeverityTiers = {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	}
}
