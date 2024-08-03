/* eslint-disable no-console */
import {Trans} from '@lingui/react'
import {DataLink, StatusLink} from 'components/ui/DbLink'
import {Status} from 'data/STATUSES'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import React from 'react'

export class Venoms extends CoreProcs {

	@dependency private checklist!: Checklist
	override trackedProcs = [
		//GCD Procs
		{
			procStatus: this.data.statuses.HINDSBANE_VENOM,
			consumeActions: [this.data.actions.HINDSBANE_FANG],
		},
		{
			procStatus: this.data.statuses.HINDSTUNG_VENOM,
			consumeActions: [this.data.actions.HINDSTING_STRIKE],
		},
		{
			procStatus: this.data.statuses.FLANKSBANE_VENOM,
			consumeActions: [this.data.actions.FLANKSBANE_FANG],
		},
		{
			procStatus: this.data.statuses.GRIMHUNTERS_VENOM,
			consumeActions: [this.data.actions.JAGGED_MAW],
		},
		{
			procStatus: this.data.statuses.FLANKSTUNG_VENOM,
			consumeActions: [this.data.actions.FLANKSTING_STRIKE],
		},
		{
			procStatus: this.data.statuses.GRIMSKINS_VENOM,
			consumeActions: [this.data.actions.BLOODIED_MAW],
		},
		//OGCD Procs
		{
			procStatus: this.data.statuses.POISED_FOR_TWINBLOOD,
			consumeActions: [this.data.actions.UNCOILED_TWINBLOOD],
		},
		{
			procStatus: this.data.statuses.FELLSKINS_VENOM,
			consumeActions: [this.data.actions.TWINBLOOD_THRESH],
		},
		{
			procStatus: this.data.statuses.POISED_FOR_TWINFANG,
			consumeActions: [this.data.actions.UNCOILED_TWINFANG],
		},
		{
			procStatus: this.data.statuses.FELLHUNTERS_VENOM,
			consumeActions: [this.data.actions.TWINFANG_THRESH],
		},
		{
			procStatus: this.data.statuses.HUNTERS_VENOM,
			consumeActions: [this.data.actions.TWINFANG_BITE],
		},
		{
			procStatus: this.data.statuses.SWIFTSKINS_VENOM,
			consumeActions: [this.data.actions.TWINBLOOD_BITE],
		},
	]

	override showProcIssueOutput = true

	override showDroppedProcSuggestion = true
	override droppedProcIcon = this.data.actions.HINDSBANE_FANG.icon
	override droppedProcContent =
		<Trans id="vpr.venoms.suggestions.drops.content">
			Avoid dropping your venom buffs unless absolutely unavoidable. Use your <DataLink action="TWINBLOOD"/> and <DataLink action="TWINFANG"/> actions in the proper order to avoid losing procs.
		</Trans>

	override showOverwroteProcSuggestion = true
	override overwroteProcIcon = this.data.actions.FLANKSTING_STRIKE.icon
	override overwroteProcContent =
		<Trans id="vpr.venoms.suggestions.overwrite.content">
			Avoid overwriting your procs.
		</Trans>

	override addJobSpecificSuggestions() {
		//TODO: Better Implemention, I'm not thrilled with this, but it works with some magic. if 2 buffs that have 0 status applications during the fight are in a row, it will skip the following one.
		// I fixed this by staggering the buffs in the order above, but I'd prefer to maintain a sense of uniformity in the order of the buffs.
		const ProcsToJudge = this.trackedProcs
		ProcsToJudge.forEach(proc => {
			if (this.getHistoryForStatus(proc.procStatus.id).length === 0) {
				ProcsToJudge.splice(ProcsToJudge.indexOf(proc), 1)
			}
		}
		)

		this.checklist.add(new Rule({
			name: <Trans id="vpr.venom.usage.title">Use your venom buffs</Trans>,
			description: <Trans id="vpr.venom.checklist.content">
				Viper generates venom buffs that increase the damage of certain actions. Make sure to use these actions while the buffs are active. Going out of order will cause the buff to drop.
			</Trans>,
			requirements: ProcsToJudge.map(proc => this.VenomChecklistRequirement(proc.procStatus)),
		}))

	}

	private VenomChecklistRequirement(buffStatus: Status) {
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

