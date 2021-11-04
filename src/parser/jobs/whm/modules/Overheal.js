import {Trans} from '@lingui/react'
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
			name: <Trans id="whm.overheal.hot.name">Healing Over Time</Trans>,
			color: SuggestedColors[1],
			trackedHealIds: [STATUSES.REGEN.id, STATUSES.MEDICA_II.id, STATUSES.ASYLUM.id],
		},
		{
			name: <Trans id="whm.overheal.assize.name">Assize</Trans>,
			color: SuggestedColors[2],
			trackedHealIds: [ACTIONS.ASSIZE.id],
		},
	]
}
