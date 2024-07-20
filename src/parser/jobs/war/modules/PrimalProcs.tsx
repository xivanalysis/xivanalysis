import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Procs as CoreProcs} from 'parser/core/modules/Procs'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITY_MISSED_PROCS = {
	1: SEVERITY.MAJOR,
}

export class PrimalProcs extends CoreProcs {

	override trackedProcs = [
		{
			procStatus: this.data.statuses.PRIMAL_REND_READY,
			consumeActions: [this.data.actions.PRIMAL_REND],
		},
		{
			procStatus: this.data.statuses.PRIMAL_RUINATION_READY,
			consumeActions: [this.data.actions.PRIMAL_RUINATION],
		},
		{
			procStatus: this.data.statuses.WRATHFUL,
			consumeActions: [this.data.actions.PRIMAL_WRATH],
		},
	]

	protected override addJobSpecificSuggestions() {
		const missedRend = this.getDropCountForStatus(this.data.statuses.PRIMAL_REND_READY.id)
		const missedRuination = this.getDropCountForStatus(this.data.statuses.PRIMAL_RUINATION_READY.id)
		const missedWrath = this.getDropCountForStatus(this.data.statuses.WRATHFUL.id)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.PRIMAL_REND.icon,
			content: <Trans id="war.primalrend.suggestions.dropped.content">
				Using <DataLink action="INNER_RELEASE" /> grants <DataLink status="PRIMAL_REND_READY" />. Use it for a strong attack and to unlock the even stronger <DataLink action="PRIMAL_RUINATION" />.
			</Trans>,
			tiers: SEVERITY_MISSED_PROCS,
			value: missedRend,
			why: <Trans id="war.primalrend.suggestions.dropped.why">
				You missed <Plural value={missedRend} one="# Primal Rend use" other="# Primal Rend uses" />.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.PRIMAL_RUINATION.icon,
			content: <Trans id="war.primalruination.suggestions.dropped.content">
				Using <DataLink action="PRIMAL_REND" /> grants you <DataLink status="PRIMAL_RUINATION_READY" /> for 20 seconds which lets you use <DataLink action="PRIMAL_RUINATION" />. It is your highest damage GCD, so try to spend it before it expires.
			</Trans>,
			tiers: SEVERITY_MISSED_PROCS,
			value: missedRuination,
			why: <Trans id="war.primalruination.suggestions.dropped.why">
			You let <Plural value={missedRuination} one="# Primal Ruination proc" other="# Primal Ruination procs" /> time out.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.PRIMAL_WRATH.icon,
			content: <Trans id="war.primalwrath.suggestions.dropped.content">
				Using <DataLink action="FELL_CLEAVE" /> 3 times under <DataLink status="INNER_RELEASE" /> lets you use <DataLink action="PRIMAL_WRATH" />. Try to spend it before it expires.
			</Trans>,
			tiers: SEVERITY_MISSED_PROCS,
			value: missedWrath,
			why: <Trans id="war.primalwrath.suggestions.dropped.why">
			You let <Plural value={missedWrath} one="# Primal Wrath proc" other="# Primal Wrath procs" /> time out.
			</Trans>,
		}))
	}

}
