import {Trans, Plural} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITY_OVERWRITTEN_PROCS = {
	1: SEVERITY.MINOR,
	15: SEVERITY.MEDIUM,
}

const SEVERITY_INVULN_PROCS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

const SEVERITY_MISSED_PROCS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	7: SEVERITY.MAJOR,
}

const SEVERITY_CRITICAL_PROCS = {
	1: SEVERITY.MAJOR,
}

export class Procs extends CoreProcs {
	/**
	 * Procs that a RDM gains over a fight caused by the RDM themselves
	 */
	trackedProcs = [
		{
			procStatus: this.data.statuses.VERSTONE_READY,
			consumeActions: [this.data.actions.VERSTONE],
		},
		{
			procStatus: this.data.statuses.VERFIRE_READY,
			consumeActions: [this.data.actions.VERFIRE],
		},
		{
			procStatus: this.data.statuses.GRAND_IMPACT_READY,
			consumeActions: [this.data.actions.GRAND_IMPACT],
		},
		//We are uncertain if we want this here or on their own, for now they'll be on their own.
		//Leaving this here in case we change our minds
		// {
		// 	procStatus: this.data.statuses.PREFULGENCE_READY,
		// 	consumeActions: [this.data.actions.PREFULGENCE],
		// },
		// {
		// 	procStatus: this.data.statuses.THORNED_FLOURISH,
		// 	consumeActions: [this.data.actions.VICE_OF_THORNS],
		// },
	]

	// Currently we only care about Invuln points in time, this has been requested quite often in The Balance from RDMs looking over their logs
	override showProcIssueOutput = true
	override showDroppedProcOutput = false
	override showOverwrittenProcOutput = false
	override procOutputHeader = <Trans id="rdm.procs.invulnlist.preface">
		Each of the bullets below is the chronological order of procs wasted on an invulnerable boss
	</Trans>

	private getMissedProcContent(missedFire: number, missedStone: number) {
		if (missedFire > 0 && missedStone > 0) {
			return <Trans id="rdm.procs.suggestions.missed.content">
				Try to use <DataLink action="VERFIRE" /> whenever you have <DataLink status="VERFIRE_READY"/> or <DataLink action="VERSTONE" /> whenever you have <DataLink status="VERSTONE_READY"/> to avoid losing out on mana gains.
			</Trans>
		}
		if (missedFire > 0) {
			return <Trans id="rdm.procs.suggestions.missed-fire.content">
				Try to use <DataLink action="VERFIRE" /> whenever you have <DataLink status="VERFIRE_READY"/> to avoid losing out on mana gains.
			</Trans>
		}
		return <Trans id="rdm.procs.suggestions.missed-stone.content">
			Try to use <DataLink action="VERSTONE" /> whenever you have <DataLink status="VERSTONE_READY"/> to avoid losing out on mana gains.
		</Trans>
	}

	private getMissedProcWhy(missedFire: number, missedStone: number) {
		if (missedFire > 0 && missedStone > 0) {
			return <Trans id="rdm.procs.suggestions.missed.why">
				You missed <Plural value={missedFire} one="# Verfire proc" other="# Verfire procs" /> and <Plural value={missedStone} one="# Verstone proc" other="# Verstone procs" />.
			</Trans>
		}
		if (missedFire > 0) {
			return <Trans id="rdm.procs.suggestions.missed-fire.why">
				You missed <Plural value={missedFire} one="# Verfire proc" other="# Verfire procs" />.
			</Trans>
		}
		return <Trans id="rdm.procs.suggestions.missed-stone.why">
			You missed <Plural value={missedStone} one="# Verstone proc" other="# Verstone procs" />.
		</Trans>
	}

	private getOverwrittenProcContent(overWrittenFire: number, overWrittenStone: number) {
		if (overWrittenFire > 0 && overWrittenStone > 0) {
			return <Trans id="rdm.procs.suggestions.overwritten.content">
				Don't cast <DataLink action="VERTHUNDER_III"/> when you have <DataLink status="VERFIRE_READY"/> or <DataLink action="VERAERO_III"/> when you have <DataLink status="VERSTONE_READY"/>.
			</Trans>
		}
		if (overWrittenFire > 0) {
			return <Trans id="rdm.procs.suggestions.overwritten-fire.content">
				Don't cast <DataLink action="VERTHUNDER_III" /> when you have <DataLink status="VERFIRE_READY"/>.
			</Trans>
		}
		return <Trans id="rdm.procs.suggestions.overwritten-stone.content">
			Don't cast <DataLink action="VERAERO_III" /> when you have <DataLink status="VERSTONE_READY"/>.
		</Trans>
	}

	private getOverwrittenProcWhy(overWrittenFire: number, overWrittenStone: number) {
		if (overWrittenFire > 0 && overWrittenStone > 0) {
			return <Trans id="rdm.procs.suggestions.overwritten.why">
				<Plural value={overWrittenFire} one="# Verfire proc" other="# Verfire procs" /> and <Plural value={overWrittenStone} one="# Verstone proc" other="# Verstone procs" /> were lost due to being overwritten.
			</Trans>
		}
		if (overWrittenFire > 0) {
			return <Trans id="rdm.procs.suggestions.overwritten-fire.why">
				<Plural value={overWrittenFire} one="# Verfire proc was" other="# Verfire procs were" /> lost due to being overwritten.
			</Trans>
		}
		return <Trans id="rdm.procs.suggestions.overwritten-stone.why">
			<Plural value={overWrittenStone} one="# Verstone proc was" other="# Verstone procs were" /> lost due to being overwritten.
		</Trans>
	}

	private getInvulnProcContent(invulnFire: number, invulnStone: number) {
		if (invulnFire > 0 && invulnStone > 0) {
			return <Trans id="rdm.procs.suggestions.invuln.content">
				Try not to use <DataLink action="VERFIRE"/> and <DataLink action="VERSTONE"/> while the boss is invulnerable.
			</Trans>
		}
		if (invulnFire > 0) {
			return <Trans id="rdm.procs.suggestions.invuln-fire.content">
				Try not to use <DataLink action="VERFIRE"/> while the boss is invulnerable.
			</Trans>
		}
		return <Trans id="rdm.procs.suggestions.invuln-stone.content">
			Try not to use <DataLink action="VERSTONE"/> while the boss is invulnerable.
		</Trans>
	}

	private getInvulnProcWhy(invulnFire: number, invulnStone: number) {
		if (invulnFire > 0 && invulnStone > 0) {
			return <Trans id="rdm.procs.suggestions.invuln.why">
				You used <Plural value={invulnFire} one="# Verfire proc" other="# Verfire procs" /> and <Plural value={invulnStone} one="# Verstone proc" other="# Verstone procs" /> on an invulnerable boss.
			</Trans>
		}
		if (invulnFire > 0) {
			return <Trans id="rdm.procs.suggestions.invuln-fire.why">
				You used <Plural value={invulnFire} one="# Verfire proc" other="# Verfire procs" /> on an invulnerable boss.
			</Trans>
		}
		return <Trans id="rdm.procs.suggestions.invuln-stone.why">
			You used <Plural value={invulnStone} one="# Verstone proc" other="# Verstone procs" /> on an invulnerable boss.
		</Trans>
	}

	protected override addJobSpecificSuggestions() {
		const missedFire = this.getDropCountForStatus(this.data.statuses.VERFIRE_READY.id)
		const invulnFire = this.getInvulnCountForStatus(this.data.statuses.VERFIRE_READY.id)
		const overWrittenFire = this.getOverwriteCountForStatus(this.data.statuses.VERFIRE_READY.id)
		const missedStone = this.getDropCountForStatus(this.data.statuses.VERSTONE_READY.id)
		const invulnStone = this.getInvulnCountForStatus(this.data.statuses.VERSTONE_READY.id)
		const overWrittenStone = this.getOverwriteCountForStatus(this.data.statuses.VERSTONE_READY.id)

		//Icons always default to the White Mana spell if black/jolt spells don't have more bad items.
		//Fire/Stone are identical
		this.suggestions.add(new TieredSuggestion({
			icon: missedFire > missedStone ? this.data.actions.VERFIRE.icon : this.data.actions.VERSTONE.icon,
			content: this.getMissedProcContent(missedFire, missedStone),
			tiers: SEVERITY_MISSED_PROCS,
			value: missedFire + missedStone,
			why: this.getMissedProcWhy(missedFire, missedStone),
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.GRAND_IMPACT.icon,
			content: <Trans id="rdm.procs.suggestions.grandimpact.content">
					Try to consume <DataLink status="GRAND_IMPACT_READY"/> before it expires as <DataLink action="GRAND_IMPACT"/> Gives 3 White & Black Mana and is one of your strongest GCDs outside of your Finisher Combo.
			</Trans>,
			tiers: SEVERITY_CRITICAL_PROCS,
			value: this.getDropCountForStatus(this.data.statuses.GRAND_IMPACT_READY.id),
			why: <Trans id="rdm.grandimpact.suggestions.dropped.why">
				<DataLink status="GRAND_IMPACT_READY"/> timed out <Plural value={this.getDropCountForStatus(this.data.statuses.GRAND_IMPACT_READY.id)} one="# time" other="# times"/>
			</Trans>,
		}))

		//Current Thought is we want these to stand on their own, leaving this here for now in case minds are changed.
		// this.suggestions.add(new TieredSuggestion({
		// 	icon: this.data.actions.PREFULGENCE.icon,
		// 	content: <Trans id="rdm.procs.suggestions.prefulgence.content">
		// 			Try to consume <DataLink status="PREFULGENCE_READY"/> before it expires as <DataLink action="PREFULGENCE"/> is your strongest skill.
		// 	</Trans>,
		// 	tiers: SEVERITY_CRITICAL_PROCS,
		// 	value: this.getDropCountForStatus(this.data.statuses.PREFULGENCE_READY.id),
		// 	why: <Trans id="rdm.prefulgence.suggestions.dropped.why">
		// 		<DataLink status="PREFULGENCE_READY"/> timed out <Plural value={this.getDropCountForStatus(this.data.statuses.PREFULGENCE_READY.id)} one="# time" other="# times"/>
		// 	</Trans>,
		// }))

		// this.suggestions.add(new TieredSuggestion({
		// 	icon: this.data.actions.VICE_OF_THORNS.icon,
		// 	content: <Trans id="rdm.procs.suggestions.viceofthorns.content">
		// 			Try to consume <DataLink status="THORNED_FLOURISH"/> before it expires as <DataLink action="VICE_OF_THORNS"/> Gives 3 White & Black Mana and is one of your strongest GCDs outside of your Finisher Combo.
		// 	</Trans>,
		// 	tiers: SEVERITY_CRITICAL_PROCS,
		// 	value: this.getDropCountForStatus(this.data.statuses.THORNED_FLOURISH.id),
		// 	why: <Trans id="rdm.viceofthorns.suggestions.dropped.why">
		// 		<DataLink status="THORNED_FLOURISH"/> timed out <Plural value={this.getDropCountForStatus(this.data.statuses.THORNED_FLOURISH.id)} one="# time" other="# times"/>
		// 	</Trans>,
		// }))

		this.suggestions.add(new TieredSuggestion({
			icon: overWrittenFire > overWrittenStone ? this.data.actions.VERFIRE.icon : this.data.actions.VERSTONE.icon,
			content: this.getOverwrittenProcContent(overWrittenFire, overWrittenStone),
			tiers: SEVERITY_OVERWRITTEN_PROCS,
			value: overWrittenFire + overWrittenStone,
			why: this.getOverwrittenProcWhy(overWrittenFire, overWrittenStone),
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: invulnFire > invulnStone ? this.data.actions.VERFIRE.icon : this.data.actions.VERSTONE.icon,
			content: this.getInvulnProcContent(invulnFire, invulnStone),
			tiers: SEVERITY_INVULN_PROCS,
			value: invulnFire + invulnStone,
			why: this.getInvulnProcWhy(invulnFire, invulnStone),
		}))
	}
}
