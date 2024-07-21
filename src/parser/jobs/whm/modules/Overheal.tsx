import {Trans} from '@lingui/react'
import {Overheal as CoreOverheal, SuggestedColors} from 'parser/core/modules/Overheal'
import React from 'react'

export class Overheal extends CoreOverheal {

	override checklistRuleBreakout = true
	override displayPieChart = true
	override displaySuggestion = true

	override trackedHealCategories = [
		{
			name: 'Assize',
			trackedHealIds: [this.data.actions.ASSIZE.id],
			ignore: true,
		},
		{
			name: <Trans id="whm.overheal.hot.name">Healing Over Time</Trans>,
			color: SuggestedColors[1],
			trackedHealIds: [
				this.data.statuses.REGEN.id,
				this.data.actions.MEDICA_II.id,
				this.data.statuses.MEDICA_II.id,
				this.data.actions.ASYLUM.id,
				this.data.statuses.ASYLUM.id,
				this.data.actions.MEDICA_III.id,
				this.data.statuses.MEDICA_III.id,
				this.data.statuses.DIVINE_AURA.id,
			],
		},
		{
			name: <Trans id="whm.overheal.liturgyofthebell.name">Liturgy of the Bell</Trans>,
			color: SuggestedColors[2],
			trackedHealIds: [
				this.data.actions.LITURGY_OF_THE_BELL_ON_DAMAGE.id,
				this.data.actions.LITURGY_OF_THE_BELL_ON_EXPIRY.id,
				this.data.actions.LITURGY_OF_THE_BELL_ACTIVATION.id,
			],
		},
		{
			name: <Trans id="whm.overheal.afflatus.name">Afflatus Healing</Trans>,
			color: SuggestedColors[3],
			trackedHealIds: [
				this.data.actions.AFFLATUS_RAPTURE.id,
				this.data.actions.AFFLATUS_SOLACE.id,
			],
		},
	]
}
