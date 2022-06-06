import {Trans} from '@lingui/react'
import {Overheal as CoreOverheal} from 'parser/core/modules/Overheal'
import React from 'react'

export class Overheal extends CoreOverheal {

	override checklistRuleBreakout = true
	override displayPieChart = true
	override displaySuggestion = true

	override trackedHealCategories = [
		{
			name: <Trans id="whm.overheal.hot.name">Healing Over Time</Trans>,
			color: '#157f1f',
			trackedHealIds: [
				this.data.statuses.REGEN.id,
				this.data.actions.MEDICA_II.id,
				this.data.statuses.MEDICA_II.id,
				this.data.actions.ASYLUM.id,
				this.data.statuses.ASYLUM.id,
			],
		},
		{
			name: <Trans id="whm.overheal.assize.name">Assize</Trans>,
			color: '#12ba45',
			trackedHealIds: [this.data.actions.ASSIZE.id],
		},
		{
			name: <Trans id="whm.overheal.liturgyofthebell.name">Liturgy of the Bell</Trans>,
			color: '#00b5ad',
			trackedHealIds: [
				this.data.actions.LITURGY_OF_THE_BELL_ON_DAMAGE.id,
				this.data.actions.LITURGY_OF_THE_BELL_ON_EXPIRY.id,
				this.data.actions.LITURGY_OF_THE_BELL_ACTIVATION.id,
			],
		},
		{
			name: <Trans id="whm.overheal.afflatus.name">Afflatus Healing</Trans>,
			color: '#a0eade',
			trackedHealIds: [
				this.data.actions.AFFLATUS_RAPTURE.id,
				this.data.actions.AFFLATUS_SOLACE.id,
			],
		},
	]
}
