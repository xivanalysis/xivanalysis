/* eslint-disable no-console */
import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink, StatusLink} from 'components/ui/DbLink'
import {Status} from 'data/STATUSES'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import DISPLAY_ORDER from 'parser/jobs/vpr/modules/DISPLAY_ORDER'
import React from 'react'

const SEVERITIES = {
	DROPPED: {
		1: SEVERITY.MEDIUM,
		3: SEVERITY.MAJOR, // You've dropped a 60 second buff 3 times, are you even pushing buttons?
	},
	OVERWRITTEN: {
		1: SEVERITY.MINOR,
		3: SEVERITY.MEDIUM,
		5: SEVERITY.MAJOR, // You've lost an entire GCD at this point from not following glowing buttons.
	},
}
const FINISHER_PROC_LOST_POTENCY = 100
export class FinisherProcs extends CoreProcs {
	static override handle = 'finisherprocs'
	static override title = t('vpr.finisherprocs.title')`Finisher Procs`
	static override displayOrder = DISPLAY_ORDER.FINISHER_PROCS
	override ProcGroupLabel = <Trans id="vpr.FinisherProcs.group.label"> Finisher Procs </Trans>

	@dependency private checklist!: Checklist
	override trackedProcs = [
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

	]
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
		const DroppedFinishers = this.getDropCountForStatus(this.data.statuses.HINDSBANE_VENOM.id) + this.getDropCountForStatus(this.data.statuses.HINDSTUNG_VENOM.id) + this.getDropCountForStatus(this.data.statuses.FLANKSBANE_VENOM.id) + this.getDropCountForStatus(this.data.statuses.FLANKSTUNG_VENOM.id) + this.getDropCountForStatus(this.data.statuses.GRIMSKINS_VENOM.id)
		const OverwroteFinishers = this.getOverwriteCountForStatus(this.data.statuses.HINDSBANE_VENOM.id) + this.getOverwriteCountForStatus(this.data.statuses.HINDSTUNG_VENOM.id) + this.getOverwriteCountForStatus(this.data.statuses.FLANKSBANE_VENOM.id) + this.getOverwriteCountForStatus(this.data.statuses.FLANKSTUNG_VENOM.id) + this.getOverwriteCountForStatus(this.data.statuses.GRIMSKINS_VENOM.id)

		this.checklist.add(new Rule({
			name: <Trans id="vpr.finisherprocs.usage.title">Use your Combo Finsher Buffs</Trans>,
			description: <Trans id="vpr.finisherprocs.checklist.content">
				Viper generates venom buffs that increase the damage of certain actions. Make sure to use these actions while the buffs are active. Going out of order will cause the buff to drop.
			</Trans>,
			displayOrder: DISPLAY_ORDER.FINISHER_PROCS,
			requirements: ProcsToJudge.map(proc => this.ChecklistRequirementMaker(proc.procStatus)),
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.HINDSBANE_FANG.icon,
			content: <Trans id="vpr.finisherprocs.suggestions.drops.content">
			Avoid dropping your <DataLink status="HINDSBANE_VENOM"/>, <DataLink status="HINDSTUNG_VENOM"/>, <DataLink status="FLANKSBANE_VENOM"/>, <DataLink status="FLANKSTUNG_VENOM"/>, <DataLink status="GRIMHUNTERS_VENOM"/> & <DataLink status="GRIMSKINS_VENOM"/> buffs as they increase the damage dealt by your combo finishers.
			</Trans>,
			tiers: SEVERITIES.DROPPED,
			value: DroppedFinishers,
			why: <Trans id="vpr.finisherprocs.suggestions.drops.why"> {DroppedFinishers * FINISHER_PROC_LOST_POTENCY} potency lost to dropped procs.</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FLANKSBANE_FANG.icon,
			content: <Trans id="vpr.finisherprocs.suggestions.overwrites.content">
			Avoid overwritting your <DataLink status="HINDSBANE_VENOM"/>, <DataLink status="HINDSTUNG_VENOM"/>, <DataLink status="FLANKSBANE_VENOM"/>, <DataLink status="FLANKSTUNG_VENOM"/>, <DataLink status="GRIMHUNTERS_VENOM"/> & <DataLink status="GRIMSKINS_VENOM"/> buffs as they increase the damage dealt by your combo finishers.
			</Trans>,
			tiers: SEVERITIES.OVERWRITTEN,
			value: OverwroteFinishers,
			why: <Trans id="vpr.finisherprocs.suggestions.overwrites.why"> {OverwroteFinishers * FINISHER_PROC_LOST_POTENCY} potency lost to overwrote procs.</Trans>,
		}))
	}

	private ChecklistRequirementMaker(buffStatus: Status) {
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

