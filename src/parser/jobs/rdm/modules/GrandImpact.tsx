import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const GRAND_IMPACT_SEVERITY = {
	1: SEVERITY.MAJOR,
}

export class GrandImpact extends CoreProcs {
	static override handle = 'grandimpact'

	override trackedProcs = [{
		procStatus: this.data.statuses.GRAND_IMPACT_READY,
		consumeActions: [this.data.actions.GRAND_IMPACT],
	}]

	override showDroppedProcSuggestion = true

	override droppedProcIcon = this.data.actions.PREFULGENCE.icon
	override droppedProcSeverityTiers = GRAND_IMPACT_SEVERITY
	override droppedProcContent = <Trans id="rdm.grandimpact.suggestions.dropped.content">
		Try to consume <DataLink status="GRAND_IMPACT_READY"/> before it expires as <DataLink action="GRAND_IMPACT"/> Gives 3 White & Black Mana and is one of your strongest GCDs outside of your Finisher Combo.
	</Trans>
	override droppedProcWhy = <Trans id="rdm.grandimpact.suggestions.dropped.why">
		<DataLink status="GRAND_IMPACT_READY"/> timed out <Plural value={this.droppedProcs} one="# time" other="# times"/>
	</Trans>
}
