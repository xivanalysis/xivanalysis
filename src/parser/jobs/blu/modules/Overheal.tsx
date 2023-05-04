import {Trans} from '@lingui/react'
import ACTIONS from 'data/ACTIONS'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Overheal as CoreOverheal, SuggestedColors} from 'parser/core/modules/Overheal'
import React from 'react'

export class Overheal extends CoreOverheal {

    @dependency private actors!: Actors

	override checklistRuleBreakout = true
	override displayPieChart = true
	override displaySuggestion = true
    override suggestionIcon = ACTIONS.POM_CURE.icon

	override trackedHealCategories = [
		{
			name: <Trans id="blu.overheal.hot.name">Healing Over Time</Trans>,
			color: SuggestedColors[1], // 0 is used for "Direct"
			trackedHealIds: [
				this.data.statuses.ANGELS_SNACK.id,
				this.data.actions.ANGELS_SNACK.id,
			],
		},
		{
			name: <Trans id="blu.overheal.aoe.name">AoE</Trans>,
			color: SuggestedColors[2],
			trackedHealIds: [
				this.data.actions.STOTRAM.id,
				this.data.actions.EXUVIATION.id,
			],
		},
		{
			name: <Trans id="blu.overheal.white_wind.name">White Wind</Trans>,
			color: SuggestedColors[3],
			trackedHealIds: [
				this.data.actions.WHITE_WIND.id,
			],
		},
	]

	override onComplete() {
		// Ideally we only run the Overheal report if the person has Healer mimickry,
		// but detection of the status is finicky since it's a stance that people
		// normally get before even going into the instance.

		// So let's instead just check if they did any sort of non-White Wind healing
		const nonWWhealing = this.direct.heal + this.trackedOverheals.reduce((acc, entry) => {
			if (entry.trackedHealIds[0] === this.data.actions.WHITE_WIND.id) {
				return acc
			}
			return acc + entry.heal
		}, 0)

		if (nonWWhealing === 0) {
			// No direct healing... But did they use Angel's Snack or the AoE heals?
			return
		}
		super.onComplete()
	}
}
