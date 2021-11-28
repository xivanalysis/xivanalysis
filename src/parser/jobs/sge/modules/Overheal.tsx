import {Trans} from '@lingui/macro'
import {DataLink} from 'components/ui/DbLink'
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
				this.data.statuses.KERAKEIA.id, // TODO: Assuming Kerakeia is the additional regen affect, since Taurochole doesn't have that
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
				this.data.actions.PEPSIS.id,
			],
		},
		{
			name: <DataLink showIcon={false} status="KARDION"/>,
			color: SuggestedColors[3],
			trackedHealIds: [
				this.data.statuses.KARDION.id,
			],
		},
	]
}
