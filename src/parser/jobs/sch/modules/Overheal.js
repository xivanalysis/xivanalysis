import {Trans} from '@lingui/macro'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Overheal as CoreOverheal, SuggestedColors} from 'parser/core/modules/Overheal'
import React from 'react'

export default class Overheal extends CoreOverheal {
	static handle = 'overheal'

	checklistRuleBreakout = true
	displayPieChart = true
	displaySuggestion = true

	trackedHealCategories = [
		{
			name: <Trans id="sch.overheal.hot.name">Sacred Soil</Trans>,
			color: SuggestedColors[1],
			trackedHealIds: [
				STATUSES.SACRED_SOIL.id,
			],
		},
		{
			name: <Trans id="sch.overheal.fairy-and-hots.name">Fairy and HoTs</Trans>,
			color: SuggestedColors[3],
			trackedHealIds: [
				ACTIONS.FEY_BLESSING.id,
				ACTIONS.CONSOLATION.id,
				ACTIONS.SERAPHIC_VEIL.id,
				STATUSES.WHISPERING_DAWN.id,
				STATUSES.ANGELS_WHISPER.id,
				STATUSES.FEY_UNION.id,
			],
		},
		{
			name: 'Ignored Heals',
			trackedHealIds: [
				ACTIONS.EMBRACE.id,
				ACTIONS.SCH_ENERGY_DRAIN,
				STATUSES.SERAPHISM_HOT,
			],
			ignore: true,
		},
	]
}
