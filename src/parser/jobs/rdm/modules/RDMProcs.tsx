import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Events} from 'event'
import {Procs} from 'parser/core/modules/Procs'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'

const SEVERITY_OVERWRITTEN_PROCS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
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

export default class RDMProcs extends Procs {
	static title = t('rdm.procs.title')`Proc Issues`

	/**
	 * Procs that a RDM gains over a fight caused by the RDM themselves
	 */
	trackedProcs = [
		{
			procStatus: STATUSES.VERSTONE_READY,
			consumeActions: [ACTIONS.VERSTONE],
		},
		{
			procStatus: STATUSES.VERFIRE_READY,
			consumeActions: [ACTIONS.VERFIRE],
		},
	]

	private getMissedProcContent(missedFire: number, missedStone: number) {
		if (missedFire > 0 && missedStone > 0) {
			return <Trans id="rdm.procs.suggestions.missed.content">
				Try to use <ActionLink {...ACTIONS.VERFIRE} /> whenever you have <StatusLink {...STATUSES.VERFIRE_READY} /> or <ActionLink {...ACTIONS.VERSTONE} /> whenever you have <StatusLink {...STATUSES.VERSTONE_READY} /> to avoid losing out on mana gains.
			</Trans>
		}
		if (missedFire > 0) {
			return <Trans id="rdm.procs.suggestions.missed-fire.content">
				Try to use <ActionLink {...ACTIONS.VERFIRE} /> whenever you have <StatusLink {...STATUSES.VERFIRE_READY} /> to avoid losing out on mana gains.
			</Trans>
		}
		return <Trans id="rdm.procs.suggestions.missed-stone.content">
			Try to use <ActionLink {...ACTIONS.VERSTONE} /> whenever you have <StatusLink {...STATUSES.VERSTONE_READY} /> to avoid losing out on mana gains.
		</Trans>
	}

	private getMissedProcWhy(missedFire: number, missedStone: number) {
		if (missedFire > 0 && missedStone > 0) {
			return <Trans id="rdm.procs.suggestions.missed.why">
				You missed <Plural value={missedFire} one="# Verfire proc" other="# Verfire procs" />, and <Plural value={missedStone} one="# Verstone proc" other="# Verstone procs" />.
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
				Don't cast <ActionLink {...ACTIONS.VERTHUNDER} /> when you have <StatusLink {...STATUSES.VERFIRE_READY} /> or <ActionLink {...ACTIONS.VERAERO} /> when you have <StatusLink {...STATUSES.VERSTONE_READY} />.
			</Trans>
		}
		if (overWrittenFire > 0) {
			return <Trans id="rdm.procs.suggestions.overwritten-fire.content">
				Don't cast <ActionLink {...ACTIONS.VERTHUNDER} /> when you have <StatusLink {...STATUSES.VERFIRE_READY} />.
			</Trans>
		}
		return <Trans id="rdm.procs.suggestions.overwritten-stone.content">
			Don't cast <ActionLink {...ACTIONS.VERAERO} /> when you have <StatusLink {...STATUSES.VERSTONE_READY} />.
		</Trans>
	}

	private getOverwrittenProcWhy(overWrittenFire: number, overWrittenStone: number) {
		if (overWrittenFire > 0 && overWrittenStone > 0) {
			return <Trans id="rdm.procs.suggestions.overwritten.why">
				<Plural value={overWrittenFire} one="# Verfire proc" other="# Verfire procs" />, and <Plural value={overWrittenStone} one="# Verstone proc" other="# Verstone procs" /> were lost due to being overwritten.
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
				Try not to use <ActionLink {...ACTIONS.VERFIRE} />, and <ActionLink {...ACTIONS.VERSTONE} /> while the boss is invulnerable.
			</Trans>
		}
		if (invulnFire > 0) {
			return <Trans id="rdm.procs.suggestions.invuln-fire.content">
				Try not to use <ActionLink {...ACTIONS.VERFIRE} /> while the boss is invulnerable.
			</Trans>
		}
		return <Trans id="rdm.procs.suggestions.invuln-stone.content">
			Try not to use <ActionLink {...ACTIONS.VERSTONE} /> while the boss is invulnerable.
		</Trans>
	}

	private getInvulnProcWhy(invulnFire: number, invulnStone: number) {
		if (invulnFire > 0 && invulnStone > 0) {
			return <Trans id="rdm.procs.suggestions.invuln.why">
				You used <Plural value={invulnFire} one="# Verfire proc" other="# Verfire procs" />, and <Plural value={invulnStone} one="# Verstone proc" other="# Verstone procs" /> on an invulnerable boss.
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

	protected addJobSpecificSuggestions() {
		const missedFire = this.getDropsForStatus(STATUSES.VERFIRE_READY.id).length - this.getUsagesForStatus(STATUSES.VERFIRE_READY.id).length
		const invulnFire = this.getInvulnsForStatus(STATUSES.VERFIRE_READY.id).length
		const overWrittenFire = this.getOverwritesForStatus(STATUSES.VERFIRE_READY.id).length
		const missedStone = this.getDropsForStatus(STATUSES.VERSTONE_READY.id).length - this.getUsagesForStatus(STATUSES.VERSTONE_READY.id).length
		const invulnStone = this.getInvulnsForStatus(STATUSES.VERSTONE_READY.id).length
		const overWrittenStone = this.getOverwritesForStatus(STATUSES.VERSTONE_READY.id).length

		//Icons always default to the White Mana spell if black/jolt spells don't have more bad items.
		//Fire/Stone are identical
		this.suggestions.add(new TieredSuggestion({
			icon: missedFire > missedStone ? ACTIONS.VERFIRE.icon : ACTIONS.VERSTONE.icon,
			content: this.getMissedProcContent(missedFire, missedStone),
			tiers: SEVERITY_MISSED_PROCS,
			value: missedFire + missedStone,
			why: this.getMissedProcWhy(missedFire, missedStone),
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: overWrittenFire > overWrittenStone ? ACTIONS.VERFIRE.icon : ACTIONS.VERSTONE.icon,
			content: this.getOverwrittenProcContent(overWrittenFire, overWrittenStone),
			tiers: SEVERITY_OVERWRITTEN_PROCS,
			value: overWrittenFire + overWrittenStone,
			why: this.getOverwrittenProcWhy(overWrittenFire, overWrittenStone),
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: invulnFire > invulnStone ? ACTIONS.VERFIRE.icon : ACTIONS.VERSTONE.icon,
			content: this.getInvulnProcContent(invulnFire, invulnStone),
			tiers: SEVERITY_INVULN_PROCS,
			value: invulnFire + invulnStone,
			why: this.getInvulnProcWhy(invulnFire, invulnStone),
		}))
	}

	output() {
		const allInvulns = this.getUsagesForStatus(STATUSES.VERFIRE_READY.id).concat(this.getInvulnsForStatus(STATUSES.VERSTONE_READY.id)).sort((a, b) => a.timestamp - b.timestamp)
		if (allInvulns.length === 0) {
			return
		}

		//Currently we only care about Invuln points in time, this has been requested quite often in The Balance from RDMs looking over their logs
		return <Fragment>
			<Trans id="rdm.procs.invulnlist.preface">
				Each of the bullets below is the chronological order of procs wasted on an invulnerable boss
			</Trans>
			<ul>
				{allInvulns.map(item => <li key={item.timestamp}>
					<strong>{this.parser.formatEpochTimestamp(item.timestamp)}</strong>:&nbsp;
					{this.data.getAction((item as Events['action']).action)?.name}&nbsp;-&nbsp;<strong><Trans id="rdm.procs.invuln.target">Target</Trans></strong>:&nbsp;{this.actors.get((item as Events['action']).target).name}
				</li>)}
			</ul>
		</Fragment>
	}
}
