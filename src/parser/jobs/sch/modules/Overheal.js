import React from 'react'
import {Trans} from '@lingui/macro'

import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {CoreOverheal, SuggestedColors} from 'parser/core/modules/Overheal'

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
			name: <Trans id="sch.overheal.pet.name">Fairy</Trans>,
			color: SuggestedColors[2],
			trackedHealIds: [
				ACTIONS.FEY_BLESSING.id,
				ACTIONS.CONSOLATION.id,
				ACTIONS.EMBRACE.id,
				ACTIONS.SERAPHIC_VEIL.id,
			],
		},
		{
			name: <Trans id="sch.overheal.pethot.name">Fairy HoTs</Trans>,
			color: SuggestedColors[3],
			trackedHealIds: [
				STATUSES.WHISPERING_DAWN.id,
				STATUSES.ANGELS_WHISPER.id,
				STATUSES.FEY_UNION.id,
			],
		},
	]
}
