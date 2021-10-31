import {Trans} from '@lingui/react'
import {Overheal as CoreOverheal, SuggestedColors} from 'parser/core/modules/Overheal'
import React from 'react'

export class Overheal extends CoreOverheal {
	static override handle = 'overheal'

	protected override checklistRuleBreakout = true
	protected override displayPieChart = true
	protected override displaySuggestion = true

	protected override trackedHealCategories = [
		{
			name: <Trans id="ast.overheal.hot.name">Healing over Time</Trans>,
			color: SuggestedColors[1],
			trackedHealIds: [
				this.data.statuses.ASPECTED_HELIOS.id,
				this.data.statuses.WHEEL_OF_FORTUNE_DIURNAL.id,
				this.data.statuses.WHEEL_OF_FORTUNE_NOCTURNAL.id,
				this.data.statuses.ASPECTED_BENEFIC.id,
				this.data.statuses.DIURNAL_OPPOSITION.id,
				this.data.statuses.DIURNAL_INTERSECTION.id,
				this.data.statuses.DIURNAL_BALANCE.id,
			],
		},
		{
			name: <Trans id="ast.overheal.earthlystar.name">Earthly Star</Trans>,
			color: SuggestedColors[2],
			trackedHealIds: [
				this.data.actions.STELLAR_BURST.id,
				this.data.actions.STELLAR_EXPLOSION.id,
			],
		},
	]
}
