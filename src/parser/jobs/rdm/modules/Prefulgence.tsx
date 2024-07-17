import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const PREFULGENCE_SEVERITY = {
	1: SEVERITY.MAJOR,
}

export class Prefulgence extends CoreProcs {
	static override handle = 'prefulgence'

	override trackedProcs = [{
		procStatus: this.data.statuses.PREFULGENCE_READY,
		consumeActions: [this.data.actions.PREFULGENCE],
	}]

	override showDroppedProcSuggestion = true

	override droppedProcIcon = this.data.actions.PREFULGENCE.icon
	override droppedProcSeverityTiers = PREFULGENCE_SEVERITY
	override droppedProcContent = <Trans id="rdm.prefulgence.suggestions.dropped.content">
		Try to consume <DataLink status="PREFULGENCE_READY"/> before it expires as <DataLink action="PREFULGENCE"/> is your strongest skill.
	</Trans>
	override droppedProcWhy = <Trans id="rdm.prefulgence.suggestions.dropped.why">
		<DataLink status="PREFULGENCE_READY"/> timed out <Plural value={this.droppedProcs} one="# time" other="# times"/>
	</Trans>
}
