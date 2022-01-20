import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITY_OVERWRITTEN_PROCS = {
	1: SEVERITY.MINOR,
	7: SEVERITY.MEDIUM,
}
const PROC_POTENCY = 60

export class Reaver extends CoreProcs {
	static override title = t('rpr.reaver.title')`Incorrect Soul Reaver Usage`

	/**
	 * RPR procs gained over the course of a fight
	 */
	trackedProcs = [
		{
			procStatus: this.data.statuses.ENHANCED_GIBBET,
			consumeActions: [this.data.actions.GIBBET],
		},
		{
			procStatus: this.data.statuses.ENHANCED_GALLOWS,
			consumeActions: [this.data.actions.GALLOWS],
		},
	]

	private getOverwrittenProcContent(overwrittenGibbet: number, overwrittenGallows: number) {
		if (overwrittenGibbet > 0 && overwrittenGallows > 0) {
			return <Trans id="rpr.reaver.overwritten.content">
				Avoid using <DataLink action="GALLOWS" /> when you have <DataLink status="ENHANCED_GIBBET" /> or <DataLink action="GALLOWS" /> when you have <DataLink status="ENHANCED_GIBBET" />
			</Trans>
		}
		if (overwrittenGibbet > 0) {
			return <Trans id="rpr.reaver.overwritten-gibbet.content">
				Avoid using <DataLink action="GALLOWS" /> when you have <DataLink status="ENHANCED_GIBBET" />
			</Trans>
		}
		return <Trans id="rpr.reaver.overwritten-gallows.content">
			Avoid using <DataLink action="GIBBET" /> when you have <DataLink status="ENHANCED_GALLOWS" />
		</Trans>
	}
	private getOverwrittenProcWhy(overwrittenGibbet: number, overwrittenGallows: number) {
		if (overwrittenGibbet > 0 && overwrittenGallows > 0) {
			return <Trans id="rpr.reaver.overwritten.why">
				<Plural value={overwrittenGibbet} one="# Enhanced Gibbet proc" other="# Enhanced Gibbet procs" /> and <Plural value={overwrittenGallows} one="# Enhanced Gallows proc" other="# Enhanced Gallows Procs" /> were lost due to being overwritten, causing a loss of {(overwrittenGibbet + overwrittenGallows) * PROC_POTENCY} potency.
			</Trans>
		}
		if (overwrittenGibbet > 0) {
			return <Trans id="rpr.reaver.overwritten-gibbet.why">
				<Plural value={overwrittenGibbet} one="# Enhanced Gibbet proc was" other="# Enhanced Gibbet procs were" /> lost due to being overwritten, causing a loss of {overwrittenGibbet * PROC_POTENCY} potency
			</Trans>
		}
		return <Trans id="rpr.reaver.overwritten-gallows.why">
			<Plural value={overwrittenGibbet} one="# Enhanced Gallows proc was" other="# Enhanced Gallows procs were" /> lost due to being overwritten, causing a loss of {overwrittenGallows * PROC_POTENCY} potency
		</Trans>
	}
	protected override addJobSpecificSuggestions() {
		const overwrittenGibbet = this.getOverwriteCountForStatus(this.data.statuses.ENHANCED_GIBBET.id)
		const overwrittenGallows = this.getOverwriteCountForStatus(this.data.statuses.ENHANCED_GALLOWS.id)

		this.suggestions.add(new TieredSuggestion({
			icon: overwrittenGibbet > overwrittenGallows ? this.data.actions.GIBBET.icon : this.data.actions.GALLOWS.icon,
			content: this.getOverwrittenProcContent(overwrittenGibbet, overwrittenGallows),
			tiers: SEVERITY_OVERWRITTEN_PROCS,
			value: overwrittenGibbet + overwrittenGallows,
			why: this.getOverwrittenProcWhy(overwrittenGibbet, overwrittenGallows),
		}))
	}
}
