import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const VICE_SEVERITY = {
	1: SEVERITY.MAJOR,
}

export class ViceOfThorns extends CoreProcs {
	static override handle = 'viceofthorns'

	override trackedProcs = [{
		procStatus: this.data.statuses.THORNED_FLOURISH,
		consumeActions: [this.data.actions.VICE_OF_THORNS],
	}]

	override showDroppedProcSuggestion = true

	override droppedProcIcon = this.data.actions.VICE_OF_THORNS.icon
	override droppedProcSeverityTiers = VICE_SEVERITY
	override droppedProcContent = <Trans id="rdm.viceofthorns.suggestions.dropped.content">
		Try to consume <DataLink status="THORNED_FLOURISH"/> before it expires as <DataLink action="VICE_OF_THORNS"/> is one of your strongest skills.
	</Trans>
	override droppedProcWhy = <Trans id="rdm.viceofthorns.suggestions.dropped.why">
		<DataLink status="THORNED_FLOURISH"/> timed out <Plural value={this.droppedProcs} one="# time" other="# times"/>
	</Trans>
}
