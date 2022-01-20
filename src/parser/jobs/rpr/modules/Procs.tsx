import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

// these values may need to be changed in future.
const SEVERITIES = {
	EXPIRED: {
		1: SEVERITY.MEDIUM,
		2: SEVERITY.MAJOR,
	},
	OVERWRITTEN: {
		1: SEVERITY.MINOR,
		5: SEVERITY.MEDIUM,
	},
}

//potency loss due to not using any one proc, enshrouded or reaver.
const LOST_PROC_POTENCY = 60

export class Procs extends CoreProcs {
	static override title = t('rpr.enhanced-gibbet-gallows.title')`Incorrect Soul Reaver Usage`

	trackedProcs = [
		{
			procStatus: this.data.statuses.ENHANCED_GIBBET,
			consumeActions: [this.data.actions.GIBBET],
		},
		{
			procStatus: this.data.statuses.ENHANCED_GALLOWS,
			consumeActions: [this.data.actions.GALLOWS],
		},
		{
			procStatus: this.data.statuses.ENHANCED_VOID_REAPING,
			consumeActions: [this.data.actions.VOID_REAPING],
		},
		{
			procStatus: this.data.statuses.ENHANCED_CROSS_REAPING,
			consumeActions: [this.data.actions.CROSS_REAPING],
		},
	]
	//TODO: rewrite addJobSpecificSuggestions()
	protected override addJobSpecificSuggestions() {
		const overwrittenGibbet = this.getOverwriteCountForStatus(this.data.statuses.ENHANCED_GIBBET.id)
		const overwrittenGallows = this.getOverwriteCountForStatus(this.data.statuses.ENHANCED_GALLOWS.id)
		const overwrittenCrossReaping = this.getOverwriteCountForStatus(this.data.statuses.ENHANCED_CROSS_REAPING.id)
		const overwrittenVoidReaping = this.getOverwriteCountForStatus(this.data.statuses.ENHANCED_VOID_REAPING.id)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.GIBBET.icon,
			content: <Trans id="rpr.procs.suggestions.overwritten.gibbet.content">
				<Plural value={overwrittenGibbet} one="# Enhanced Gibbet proc was" other="# Enhanced Gibbet procs were" />  overwritten by using <DataLink action="GALLOWS" />.
			</Trans>,
			tiers: SEVERITIES.OVERWRITTEN,
			value: overwrittenGibbet,
			why: <Trans id="rpr.procs.suggestions.overwritten.gibbet.why">
				You lost {overwrittenGibbet * LOST_PROC_POTENCY} potency due to overwritten procs.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.GALLOWS.icon,
			content: <Trans id="rpr.procs.suggestions.overwritten.gallows.content">
				<Plural value={overwrittenGallows} one="# Enhanced Gallows proc was" other="# Enhanced Gallows Procs were" /> overwritten by using <DataLink action="GIBBET" />.
			</Trans>,
			tiers: SEVERITIES.OVERWRITTEN,
			value: overwrittenGallows,
			why: <Trans id="rpr.procs.suggestions.overwritten.gallows.why">
				You lost {overwrittenGallows * LOST_PROC_POTENCY} potency due to overwritten procs.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.CROSS_REAPING.icon,
			content: <Trans id="rpr.procs.suggestions.overwritten.cross-reaping.content">
				<Plural value={overwrittenCrossReaping} one="# Enhanced Cross Reaping proc was" other="# Enhanced Cross Reaping procs were" /> overwritten by using <DataLink action="VOID_REAPING" />.
			</Trans>,
			tiers: SEVERITIES.OVERWRITTEN,
			value: overwrittenCrossReaping,
			why: <Trans id="rpr.procs.suggestions.overwritten.cross-reaping.why">
				You lost {overwrittenCrossReaping * LOST_PROC_POTENCY} potency due to overwritten procs.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.VOID_REAPING.icon,
			content: <Trans id="rpr.procs.suggestions.overwritten.void-reaping.content">
				<Plural value={overwrittenVoidReaping} one="# Enhanced Void Reaping proc was" other="# Enhanced Cross Reaping procs were" /> overwritten by using <DataLink action="CROSS_REAPING" />.
			</Trans>,
			tiers: SEVERITIES.OVERWRITTEN,
			value: overwrittenVoidReaping,
			why: <Trans id="rpr.procs.suggestions.overwritten.void-reaping.why">
				You lost {overwrittenVoidReaping * LOST_PROC_POTENCY} potency due to overwritten procs.
			</Trans>,
		}))
		//TODO: Expired Gibbet
		//TODO: Expired Gallows
		//TODO: Expired Cross Reaping
		//TODO: Expired Void Reaping
	}
}
