/* eslint-disable no-console */
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import React from 'react'

export class Venoms extends CoreProcs {
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
			procStatus: this.data.statuses.FLANKSTUNG_VENOM,
			consumeActions: [this.data.actions.FLANKSTING_STRIKE],
		},
		{
			procStatus: this.data.statuses.GRIMHUNTERS_VENOM,
			consumeActions: [this.data.actions.JAGGED_MAW],
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
			procStatus: this.data.statuses.POISED_FOR_TWINFANG,
			consumeActions: [this.data.actions.UNCOILED_TWINFANG],
		},
		{
			procStatus: this.data.statuses.FELLHUNTERS_VENOM,
			consumeActions: [this.data.actions.TWINFANG_THRESH],
		},
		{
			procStatus: this.data.statuses.FELLSKINS_VENOM,
			consumeActions: [this.data.actions.TWINBLOOD_THRESH],
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
}

