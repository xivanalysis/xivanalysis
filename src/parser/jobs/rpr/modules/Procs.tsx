import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {filter} from 'parser/core/filter'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

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

const LOST_PROC_POTENCY = 60

export class Procs extends CoreProcs {
	static override title = t('rpr.procs.title')`Enhanced Procs`
	static override debug = false

	private badStalks: number = 0

	override initialise() {
		super.initialise()

		// Additionally count Blood Stalk uses so we can find lost potency to Unveiled
		this.addEventHook(filter<Event>().source(this.parser.actor.id).type('action')
			.action(this.data.actions.BLOOD_STALK.id), () => this.badStalks++)
	}

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
		const badGibbetStalks = this.badStalks - expiredGibbet
		const badGallowsStalks = this.badStalks - expiredGallows

		// Sanity check, this might get weird if there's a naked Blood Stalk at the start of the fight for a borked Gluttony tho, fix later
		if (badGibbetStalks + badGallowsStalks !== this.badStalks) {
			this.debug(`Mismatched bloodstalks to lost enhanced procs: ${this.badStalks} stalks: Gibbet ${badGibbetStalks} + Gallows ${badGallowsStalks}`)
		}

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.GIBBET.icon,
			content: <Trans id="rpr.procs.suggestions.overwritten.gibbet.content">
				Avoid overwriting Enhanced <DataLink showIcon={false}  action="GIBBET"/> with an unenhanced <DataLink showIcon={false}  action="GALLOWS"/>.
				Each overwrite is the same as losing a positional, and quickly adds up.
			</Trans>,
			tiers: SEVERITIES.OVERWRITTEN,
			value: overwrittenGibbet,
			why: <Trans id="rpr.procs.suggestions.overwritten.gibbet.why">
				{overwrittenGibbet * LOST_PROC_POTENCY} potency lost due to overwriting procs.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.GALLOWS.icon,
			content: <Trans id="rpr.procs.suggestions.overwritten.gallows.content">
				Avoid overwriting Enhanced <DataLink showIcon={false} action="GALLOWS"/> with an unenhanced <DataLink showIcon={false} action="GIBBET"/>.
				Each overwrite is the same as losing a positional, and quickly adds up.
			</Trans>,
			tiers: SEVERITIES.OVERWRITTEN,
			value: overwrittenGallows,
			why: <Trans id="rpr.procs.suggestions.overwritten.gallows.why">
				{overwrittenGallows * LOST_PROC_POTENCY} potency lost due to overwriting procs.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.GIBBET.icon,
			content: <Trans id="rpr.procs.suggestions.expired.gibbet.content">
				Avoid letting Enhanced  <DataLink showIcon={false}  action="GIBBET"/> expire. On top of the lost potency itself,
				you're also losing the potency from <DataLink action="UNVEILED_GALLOWS"/> if <DataLink action="GLUTTONY"/> hasn't given you extra stacks of <DataLink status="SOUL_REAVER"/>.
			</Trans>,
			tiers: SEVERITIES.EXPIRED,
			value: expiredGibbet,
			why: <Trans id="rpr.procs.suggestions.expired.gibbet.why">
				{(expiredGibbet + badGibbetStalks) * LOST_PROC_POTENCY} potency lost to letting <Plural value={expiredGibbet} one="an Enhanced Gibbet proc" other="Enhanced Gibbet procs" /> expire.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.GALLOWS.icon,
			content: <Trans id="rpr.procs.suggestions.expired.gallows.content">
				Avoid letting Enhanced  <DataLink showIcon={false}  action="GALLOWS"/> expire. On top of the lost potency itself,
				you're also losing the potency from <DataLink action="UNVEILED_GIBBET"/> if <DataLink action="GLUTTONY"/> hasn't given you extra stacks of <DataLink status="SOUL_REAVER"/>.
			</Trans>,
			tiers: SEVERITIES.EXPIRED,
			value: expiredGallows,
			why: <Trans id="rpr.procs.suggestions.expired.gallows.why">
				{(expiredGallows + badGallowsStalks) * LOST_PROC_POTENCY} potency lost to letting <Plural value={expiredGallows} one="an Enhanced Gallows proc" other="Enhanced Gallows procs" /> expire.
			</Trans>,
		}))
	}
}
