import {Trans} from '@lingui/react'
import ACTIONS from 'data/ACTIONS'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {Overheal, SuggestedColors} from 'parser/core/modules/Overheal'
import React from 'react'

export class BLUOverheal extends Overheal {
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

	override initialise() {
		// the eventhooks look like a FIFO but might as well just add
		// this hook twice in case it also behaves like a LIFO in some
		// scenario.
		this.addEventHook(filter<Event>().type('complete'), this.onCompleteExtra)
		super.initialise()
		this.addEventHook(filter<Event>().type('complete'), this.onCompleteExtra)
	}

	override considerHeal(event: Events['heal'], _pet: boolean = false): boolean {
		// Filter out Devour; it's going to be used on cooldown by tanks, and either
		// as a DPS button or occasionally as a mechanic button (e.g. A8S Gavel)
		if (event.cause.type === 'action') {
			return event.cause.action !== this.data.actions.DEVOUR.id
		}
		return true
	}

	private onCompleteExtra() {
		// Ideally we only run the Overheal report if the person has Healer mimicry,
		// but detection of the status is finicky since it's a stance that people
		// normally get before even going into the instance.

		// So let's instead just check if they did any sort of non-White Wind healing
		const nonWWhealing = this.direct.heal + this.trackedOverheals.reduce((acc, entry) => {
			if (entry.idIsTracked(this.data.actions.WHITE_WIND.id)) {
				return acc
			}
			return acc + entry.heal
		}, 0)

		if (nonWWhealing !== 0) {
			return
		}

		this.checklistRuleBreakout = false
		this.displayPieChart = false
		this.displaySuggestion = false
		this.displayChecklist = false
		this.checklistRuleBreakout = false
	}
}
