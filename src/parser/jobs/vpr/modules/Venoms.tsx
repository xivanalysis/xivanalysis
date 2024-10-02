/* eslint-disable no-console */
import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink, StatusLink} from 'components/ui/DbLink'
import {Status} from 'data/STATUSES'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export class Venoms extends CoreProcs {
	static override handle = 'venoms'
	static override title = t('vpr.venoms.title')`oGCD Procs`

	override ProcGroupLabel = <Trans id="vpr.Venoms.group.label"> oGCD Procs </Trans>

	@dependency private checklist!: Checklist
	override trackedProcs = [

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
	override droppedProcIcon = this.data.actions.TWINBLOOD.icon
	override droppedProcContent =
		<Trans id="vpr.venoms.suggestions.drops.content">
			Avoid dropping your venom buffs unless absolutely unavoidable. Use your <DataLink action="TWINBLOOD"/> and <DataLink action="TWINFANG"/> actions in the proper order to avoid losing procs.
		</Trans>

	override showOverwroteProcSuggestion = true
	override overwroteProcIcon = this.data.actions.TWINFANG.icon
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
			displayOrder: DISPLAY_ORDER.VENOM_PROCS,
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

