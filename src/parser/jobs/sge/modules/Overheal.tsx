import {Trans} from '@lingui/macro'
import {Events} from 'event'
import {Overheal as CoreOverheal, SuggestedColors} from 'parser/core/modules/Overheal'
import React from 'react'

export class Overheal extends CoreOverheal {
	override checklistRuleBreakout = true
	override displayPieChart = true
	override displaySuggestion = true

	override suggestionIcon = this.data.actions.DIAGNOSIS.icon

	override trackedHealCategories = [
		{
			name: <Trans id="sge.overheal.hot.name">HoTs</Trans>,
			color: SuggestedColors[1],
			trackedHealIds: [
				this.data.statuses.PHYSIS.id,
				this.data.statuses.PHYSIS_II.id,
				this.data.statuses.KERAKEIA.id,
			],
		},
		{
			name: <Trans id="sge.overheal.cooldowns.name">Cooldowns</Trans>,
			color: SuggestedColors[2],
			trackedHealIds: [
				this.data.actions.DRUOCHOLE.id,
				this.data.actions.IXOCHOLE.id,
				this.data.actions.TAUROCHOLE.id,
				this.data.actions.HOLOS.id,
			],
		},
		{
			name: <Trans id="sge.overheal.haima.name">Haima &amp; Panhaima Expiration</Trans>,
			color: SuggestedColors[3],
			trackedHealIds: [
				this.data.statuses.HAIMATINON.id,
				this.data.statuses.PANHAIMATINON.id,
			],
		},
	]

	override considerHeal(event: Events['heal'], _pet: boolean = false): boolean {
		// Filter out Kardia heals, the SGE isn't exactly going to stop DPSing if the tank is full HP...
		if (event.cause.type === 'status') {
			return event.cause.status !== this.data.statuses.KARDIA.id
		}
		return true
	}
}
