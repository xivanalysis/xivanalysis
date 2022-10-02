import {Trans} from '@lingui/macro'
import {DataLink} from 'components/ui/DbLink'
import {Events} from 'event'
import {Overheal as CoreOverheal, SuggestedColors} from 'parser/core/modules/Overheal'
import React from 'react'

export class Overheal extends CoreOverheal {
	override checklistRuleBreakout = true
	override displayPieChart = true
	override displaySuggestion = true

	override suggestionIcon = this.data.actions.DIAGNOSIS.icon
	override overhealName = <Trans id="sge.overheal.direct.name">GCD Heals</Trans>

	override trackedHealCategories = [
		{
			name: 'Addersgall',
			trackedHealIds: [
				this.data.statuses.KERAKEIA.id,
				this.data.actions.DRUOCHOLE.id,
				this.data.actions.IXOCHOLE.id,
				this.data.actions.TAUROCHOLE.id,
			],
			ignore: true,
		},
		{
			name: <DataLink action="HOLOS" showIcon={false} showTooltip={false} />,
			color: SuggestedColors[1],
			trackedHealIds: [
				this.data.actions.HOLOS.id,
			],
			debugName: 'Holos',
		},
		{
			name: <DataLink status="PHYSIS_II" showIcon={false} showTooltip={false} />,
			color: SuggestedColors[2],
			trackedHealIds: [
				this.data.statuses.PHYSIS.id,
				this.data.statuses.PHYSIS_II.id,
			],
			debugName: 'Physis',
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
