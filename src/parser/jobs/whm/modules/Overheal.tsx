import {Trans} from '@lingui/react'
import {Overheal as CoreOverheal, SuggestedColors} from 'parser/core/modules/Overheal'
import React from 'react'

export class Overheal extends CoreOverheal {

	override checklistRuleBreakout = true
	override displayPieChart = true
	override displaySuggestion = true

	override trackedHealCategories = [
		{
			name: <Trans id="whm.overheal.hot.name">Healing Over Time</Trans>,
			color: SuggestedColors[1],
			trackedHealIds: [
				this.data.statuses.REGEN.id,
				this.data.actions.MEDICA_II.id,
				this.data.actions.ASYLUM.id,
			],
		},
		{
			name: <Trans id="whm.overheal.assize.name">Assize</Trans>,
			color: SuggestedColors[2],
			trackedHealIds: [this.data.actions.ASSIZE.id],
		},
		{
			name: <Trans id="whm.overheal.liturgyofthebell.name">Liturgy of the Bell</Trans>,
			color: SuggestedColors[3],
			trackedHealIds: [
				this.data.actions.LITURGY_OF_THE_BELL_ON_DAMAGE.id,
				this.data.actions.LITURGY_OF_THE_BELL_ON_EXPIRY.id,
			],
		},
	]
}
