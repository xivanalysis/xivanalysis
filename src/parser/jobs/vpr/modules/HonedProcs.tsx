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
const HONED_PROC_LOST_POTENCY = 100 // Aoes are only 20 potency... do I account for them?
export class HonedProcs extends CoreProcs {
	static override handle = 'honedprocs'
	static override title = t('vpr.honedprocs.title')`Honed Procs`

	override ProcGroupLabel = <Trans id="vpr.HonedProcs.group.label"> Honed Procs </Trans>

	@dependency private checklist!: Checklist
	override trackedProcs = [
		{
			procStatus: this.data.statuses.HONED_STEEL,
			consumeActions: [
				this.data.actions.STEEL_FANGS,
				this.data.actions.STEEL_MAW,
			],
		},
		{
			procStatus: this.data.statuses.HONED_REAVERS,
			consumeActions: [
				this.data.actions.REAVING_FANGS,
				this.data.actions.REAVING_MAW,
			],
		},

	]
	override addJobSpecificSuggestions() {
		const DroppedHoneds= this.getDropCountForStatus(this.data.statuses.HONED_STEEL.id) + this.getDropCountForStatus(this.data.statuses.HONED_REAVERS.id)
		const OverwroteHoneds = this.getOverwriteCountForStatus(this.data.statuses.HONED_STEEL.id) + this.getOverwriteCountForStatus(this.data.statuses.HONED_REAVERS.id)

		this.checklist.add(new Rule({
			name: <Trans id="vpr.honedprocs.usage.title">Use your <DataLink status="HONED_STEEL"/> & <DataLink status="HONED_REAVERS"/></Trans>,
			description: <Trans id="vpr.honedprocs.checklist.content">
				Viper generates venom buffs that increase the damage of certain actions. Make sure to use these actions while the buffs are active. Going out of order will cause the buff to drop.
			</Trans>,
			displayOrder: DISPLAY_ORDER.HONED_PROCS,
			requirements: this.trackedProcs.map(proc => this.ChecklistRequirementMaker(proc.procStatus)),
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.STEEL_FANGS.icon,
			content: <Trans id="vpr.honedprocs.suggestions.drops.content">
			Avoid dropping your <DataLink status="HONED_STEEL"/> & <DataLink status= "HONED_REAVERS"/> buffs as they increase the damage dealt by your combo starters.
			</Trans>,
			tiers: SEVERITIES.DROPPED,
			value: DroppedHoneds,
			why: <Trans id="vpr.honedprocs.suggestions.drops.why"> {DroppedHoneds * HONED_PROC_LOST_POTENCY} potency lost to dropped procs.</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.REAVING_FANGS.icon,
			content: <Trans id="vpr.honedprocs.suggestions.overwrites.content">
			Avoid overwritting your <DataLink status="HONED_STEEL"/> & <DataLink status= "HONED_REAVERS"/> buffs as they increase the damage dealt by your combo starters.
			</Trans>,
			tiers: SEVERITIES.OVERWRITTEN,
			value: OverwroteHoneds,
			why: <Trans id="vpr.honedprocs.suggestions.overwrites.why"> {OverwroteHoneds * HONED_PROC_LOST_POTENCY} potency lost to overwrote procs.</Trans>,
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

