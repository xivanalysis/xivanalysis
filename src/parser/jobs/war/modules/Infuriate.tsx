import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Cooldowns} from 'parser/core/modules/Cooldowns'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const INFURIATE_REDUCERS: ActionKey[] = [
	'FELL_CLEAVE',
	'DECIMATE',
	'CHAOTIC_CYCLONE',
	'INNER_CHAOS',
]

const INFURIATE_CDR = 5000

const INFURIATE_SEVERITY = {
	1: SEVERITY.MAJOR,
}

// Yes I know this is Infuriate but the proc is Nascent Chaos so here we are
export class Infuriate extends CoreProcs {
	static override handle = 'infuriate'

	@dependency private cooldowns!: Cooldowns

	override initialise() {
		super.initialise()

		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('action')
				.action(this.data.matchActionId(INFURIATE_REDUCERS)),
			() => this.cooldowns.reduce('INFURIATE', INFURIATE_CDR),
		)
	}

	override trackedProcs = [{
		procStatus: this.data.statuses.NASCENT_CHAOS,
		consumeActions: [this.data.actions.INNER_CHAOS, this.data.actions.CHAOTIC_CYCLONE],
	}]

	override showDroppedProcSuggestion = true
	override showOverwroteProcSuggestion = true

	override droppedProcIcon = this.data.actions.INFURIATE.icon
	override droppedProcSeverityTiers = INFURIATE_SEVERITY
	override droppedProcContent = <Trans id="war.infuriate.suggestions.dropped.content">
		Try to consume <DataLink status="NASCENT_CHAOS"/> before it expires, as <DataLink action="INNER_CHAOS"/> and <DataLink action="CHAOTIC_CYCLONE"/> are two of your strongest skills.
	</Trans>

	override overwroteProcIcon = this.data.actions.INFURIATE.icon
	override overwroteProcSeverityTiers = INFURIATE_SEVERITY
	override overwroteProcContent = <Trans id="war.infuriate.suggestions.overwritten.content">
		Avoid using <DataLink action="INFURIATE"/> when you already have <DataLink status="NASCENT_CHAOS"/> applied.
	</Trans>
}
