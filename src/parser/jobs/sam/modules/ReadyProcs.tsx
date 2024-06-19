import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export class ReadyProcs extends CoreProcs {
	static override handle = 'ReadyProcs'
	@dependency private checklist!: Checklist

	theOtherOgi = 0
	theOtherTendo = 0

	TRACKED_ACTIONS = [
		this.data.actions.KAESHI_NAMIKIRI.id,
		this.data.actions.TENDO_GOKEN.id,
		this.data.actions.TENDO_KAESHI_SETSUGEKKA.id,
		this.data.actions.TENDO_KAESHI_GOKEN.id,
		this.data.actions.TENDO_KAESHI_SETSUGEKKA.id,
	]

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(oneOf(this.TRACKED_ACTIONS)), this.onTrackedCast)
	}

	onTrackedCast(event: Events['action']): void {
		if (event.action === this.data.actions.KAESHI_NAMIKIRI.id) {
			this.theOtherOgi++
		} else if (event.action === this.data.actions.TENDO_KAESHI_GOKEN.id || event.action === this.data.actions.TENDO_KAESHI_SETSUGEKKA.id) {
			this.theOtherTendo++
		}
	}

	override trackedProcs = [
		{
			procStatus: this.data.statuses.ZANSHIN_READY,
			consumeActions: [this.data.actions.ZANSHIN],
		},
		{
			procStatus: this.data.statuses.OGI_NAMIKIRI_READY,
			consumeActions: [this.data.actions.OGI_NAMIKIRI],
		},
		{
			procStatus: this.data.statuses.TENDO,
			consumeActions: [
				this.data.actions.TENDO_GOKEN,
				this.data.actions.TENDO_SETSUGEKKA,
			],
		},
		{
			procStatus: this.data.statuses.TSUBAME_GAESHI_READY,
			consumeActions: [
				this.data.actions.KAESHI_SETSUGEKKA,
				this.data.actions.KAESHI_GOKEN,
				this.data.actions.TENDO_KAESHI_SETSUGEKKA,
				this.data.actions.TENDO_KAESHI_GOKEN,

			],
		},
	]

	override addJobSpecificSuggestions(): void {
		this.checklist.add(new Rule({
			name: 'Use Your Ogis',
			displayOrder: DISPLAY_ORDER.OGI,
			description: <Trans id="sam.readyprocs.ogi.waste.content">
				Using <DataLink action = "IKISHOTEN"/> grants <DataLink status = "OGI_NAMIKIRI_READY"/> which is consumed to use <DataLink action="OGI_NAMIKIRI"/> and <DataLink action="KAESHI_NAMIKIRI"/>.
				Using these skills are important for both your damage output and rotational alignment as <DataLink action="OGI_NAMIKIRI"/> and <DataLink action="KAESHI_NAMIKIRI"/> replace your filler GCDs.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="sam.readyprocs.ogi.checklist.requirement.waste.name">
						Use as many of your Ogis as possible.
					</Trans>,
					value: (this.getUsageCountForStatus(this.data.statuses.OGI_NAMIKIRI_READY.id) + this.theOtherOgi),
					target: (this.getHistoryForStatus(this.data.statuses.OGI_NAMIKIRI_READY.id).length * 2),
				}),
			],
		}))

		this.checklist.add(new Rule({
			name: 'Use Your Tendos',
			displayOrder: DISPLAY_ORDER.OGI,
			description: <Trans id="sam.readyprocs.tendo.waste.content">
				Using <DataLink action = "MEIKYO_SHISUI"/> grants <DataLink status = "TENDO"/> which is consumed to use <DataLink action="TENDO_SETSUGEKKA"/> and its followup <DataLink action="TENDO_KAESHI_SETSUGEKKA"/> or <DataLink action="TENDO_GOKEN"/> and its followup <DataLink action="TENDO_KAESHI_GOKEN"/>.
				Using these skills are a straight potency gain over your regular <DataLink action = "IAIJUTSU"/> skills and should not be missed.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="sam.readyprocs.tendo.checklist.requirement.waste.name">
						Use all of your Tendos.
					</Trans>,
					value: (this.getUsageCountForStatus(this.data.statuses.TENDO.id) + this.theOtherTendo),
					target: (this.getHistoryForStatus(this.data.statuses.TENDO.id).length * 2),
				}),
			],
		}))
	}

	override showDroppedProcSuggestion = true
	override droppedProcIcon = this.data.actions.GYOFU.icon
	override droppedProcContent =
		<Trans id="sam.readyprocs.suggestions.drops.content">
			Avoid dropping your procs unless absolutely necessary.
		</Trans>

	override showOverwroteProcSuggestion = true
	override overwroteProcIcon = this.data.actions.GYOFU.icon
	override overwroteProcContent =
		<Trans id="sam.readyprocs.suggestions.overwrite.content">
			Avoid overwriting your procs. Make sure you consume all procs from <DataLink action="MEIKYO_SHISUI"/> before using it again.
		</Trans>
}
