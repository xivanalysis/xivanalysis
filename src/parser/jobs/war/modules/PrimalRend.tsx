import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const REND_SEVERITY = {
	1: SEVERITY.MAJOR,
}

export class PrimalRend extends CoreProcs {
	static override handle = 'primalrend'

	override trackedProcs = [{
		procStatus: this.data.statuses.PRIMAL_REND_READY,
		consumeActions: [this.data.actions.PRIMAL_REND],
	}]

	override showDroppedProcSuggestion = true

	override droppedProcIcon = this.data.actions.PRIMAL_REND.icon
	override droppedProcSeverityTiers = REND_SEVERITY
	override droppedProcContent = <Trans id="war.primalrend.suggestions.dropped.content">
		Try to consume <DataLink status="PRIMAL_REND_READY"/> before it expires as <DataLink action="PRIMAL_REND"/> is your single strongest skill.
	</Trans>
	override droppedProcWhy = <Trans id="war.primalrend.suggestions.dropped.why">
		<DataLink status="PRIMAL_REND_READY"/> timed out <Plural value={this.droppedProcs} one="# time" other="# times"/>
	</Trans>
}
