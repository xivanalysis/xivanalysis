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
	]

	protected override addJobSpecificSuggestions() {
		const overwrittenGibbet = this.getOverwriteCountForStatus(this.data.statuses.ENHANCED_GIBBET.id)
		const overwrittenGallows = this.getOverwriteCountForStatus(this.data.statuses.ENHANCED_GALLOWS.id)

		const expiredGibbet = this.getDropCountForStatus(this.data.statuses.ENHANCED_GIBBET.id)
		const expiredGallows = this.getDropCountForStatus(this.data.statuses.ENHANCED_GALLOWS.id)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.GIBBET.icon,
			content: <Trans id="rpr.procs.suggestions.overwritten.gibbet.content">
				<Plural value={overwrittenGibbet} one="# Enhanced Gibbet proc was" other="# Enhanced Gibbet procs were" /> overwritten by using <DataLink action="GALLOWS" />.
			</Trans>,
			tiers: SEVERITIES.OVERWRITTEN,
			value: overwrittenGibbet,
			why: <Trans id="rpr.procs.suggestions.overwritten.gibbet.why">
				You lost {overwrittenGibbet * LOST_PROC_POTENCY} potency due to overwriting procs.
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
				You lost {overwrittenGallows * LOST_PROC_POTENCY} potency due to overwriting procs.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.GIBBET.icon,
			content: <Trans id="rpr.procs.suggestions.expired.gibbet.content">
				<Plural value={expiredGibbet} one="# Enhanced Gibbet proc was" other="# Enhanced Gibbet procs were" /> allowed to expire.
			</Trans>,
			tiers: SEVERITIES.EXPIRED,
			value: expiredGibbet,
			why: <Trans id="rpr.procs.suggestions.expired.gibbet.why">
				You lost {expiredGibbet * LOST_PROC_POTENCY} potency due to letting <DataLink status="ENHANCED_GIBBET" /> procs expire.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.GALLOWS.icon,
			content: <Trans id="rpr.procs.suggestions.expired.gallows.content">
				<Plural value={expiredGallows} one="# Enhanced Gallows proc was" other="# Enhanced Gallows procs were" /> allowed to expire.
			</Trans>,
			tiers: SEVERITIES.EXPIRED,
			value: expiredGallows,
			why: <Trans id="rpr.procs.suggestions.expired.gallows.why">
				You lost {expiredGallows * LOST_PROC_POTENCY} potency due to letting <DataLink status="ENHANCED_GALLOWS" /> procs expire.
			</Trans>,
		}))
	}
}
