import {Trans} from '@lingui/react'
import {DataLink, StatusLink} from 'components/ui/DbLink'
import {Status} from 'data/STATUSES'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import React from 'react'

export class Continuation extends CoreProcs {
	@dependency private checklist!: Checklist
	override trackedProcs = [
		{
			procStatus: this.data.statuses.READY_TO_RIP,
			consumeActions: [this.data.actions.JUGULAR_RIP],
		},
		{
			procStatus: this.data.statuses.READY_TO_TEAR,
			consumeActions: [this.data.actions.ABDOMEN_TEAR],
		},
		{
			procStatus: this.data.statuses.READY_TO_GOUGE,
			consumeActions: [this.data.actions.EYE_GOUGE],
		},
		{
			procStatus: this.data.statuses.READY_TO_BLAST,
			consumeActions: [this.data.actions.HYPERVELOCITY],
		},
		{
			procStatus: this.data.statuses.READY_TO_RAZE,
			consumeActions: [this.data.actions.FATED_BRAND],
		},
	]

	override showDroppedProcSuggestion = true
	override droppedProcIcon = this.data.actions.CONTINUATION.icon
	override droppedProcContent =
		<Trans id="gnb.continuation.suggestions.drops.content">
			Avoid dropping your <DataLink action="CONTINUATION"/> procs. They are a significant portion of your damage and should be used as soon as possible.
		</Trans>

	override addJobSpecificSuggestions() {
		const procsToJudge = this.trackedProcs
		procsToJudge.forEach(proc => {
			if (this.getHistoryForStatus(proc.procStatus.id).length === 0) {
				procsToJudge.splice(procsToJudge.indexOf(proc), 1)
			}
		})

		this.checklist.add(new Rule({
			name: <Trans id="gnb.contiunation.usage.title">Use your <DataLink action="CONTINUATION"/> skills </Trans>,
			description: <Trans id="gnb.contiunation.checklist.content">
				Gunbreaker can follow up cartridge skills with <DataLink action="CONTINUATION"/> skills. Make sure to usse them immediately as they will fall off if another GCD is pressed.
			</Trans>,
			requirements: procsToJudge.map(proc => this.continuationChecklistRequirement(proc.procStatus)),
		}))
	}

	private continuationChecklistRequirement(buffStatus: Status) {
		const actual = this.getHistoryForStatus(buffStatus.id).length - (this.getDropCountForStatus(buffStatus.id) + this.getOverwriteCountForStatus(buffStatus.id))
		const expected = this.getHistoryForStatus(buffStatus.id).length
		let percent = actual / expected * 100
		if (process.env.NODE_ENV === 'production') {
			percent = Math.min(percent, 100)
		}
		return new Requirement({
			name: <StatusLink {...buffStatus}/>,
			percent: percent,
			weight: expected,
			overrideDisplay: `${actual} / ${expected} (${percent.toFixed(2)}%)`,
		})
	}
}
