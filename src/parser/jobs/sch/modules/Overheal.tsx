import {Trans} from '@lingui/macro'
import {Overheal as CoreOverheal, SuggestedColors} from 'parser/core/modules/Overheal'
import React from 'react'

export class Overheal extends CoreOverheal {
	override checklistRuleBreakout = true
	override displayPieChart = true

	override trackedHealCategories = [
		{
			name: <Trans id="sch.overheal.hot.name">Sacred Soil</Trans>,
			color: SuggestedColors[1],
			trackedHealIds: [
				this.data.statuses.SACRED_SOIL.id,
			],
		},
		{
			name: <Trans id="sch.overheal.fairy-and-hots.name">Fairy and HoTs</Trans>,
			color: SuggestedColors[3],
			trackedHealIds: [
				this.data.actions.FEY_BLESSING.id,
				this.data.actions.CONSOLATION.id,
				this.data.actions.SERAPHIC_VEIL.id,
				this.data.statuses.WHISPERING_DAWN.id,
				this.data.statuses.ANGELS_WHISPER.id,
				this.data.statuses.FEY_UNION.id,
			],
		},
		{
			name: 'Ignored Heals',
			trackedHealIds: [
				this.data.actions.EMBRACE.id,
				this.data.actions.SCH_ENERGY_DRAIN.id,
				this.data.statuses.SERAPHISM_HOT.id,
			],
			ignore: true,
		},
	]
}
