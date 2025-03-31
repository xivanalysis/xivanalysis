import {Trans} from '@lingui/react/macro'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {Overheal, TrackedOverhealOpts} from 'parser/core/modules/Overheal'

export class BLUOverheal extends Overheal {
	protected override trackedHealCategories:TrackedOverhealOpts[] = [
		{
			name: this.defaultCategoryNames.HEALING_OVER_TIME,
			trackedHealIds: [
				this.data.statuses.ANGELS_SNACK.id,
				this.data.actions.ANGELS_SNACK.id,
			],
			includeInChecklist: true,
		},
		{
			name: <Trans id="blu.overheal.aoe.name">AoE</Trans>,
			trackedHealIds: [
				this.data.actions.STOTRAM_HEAL.id,
				this.data.actions.EXUVIATION.id,
			],
			includeInChecklist: true,
		},
		{
			name: <Trans id="blu.overheal.white_wind.name">White Wind</Trans>,
			trackedHealIds: [
				this.data.actions.WHITE_WIND.id,
			],
			includeInChecklist: true,
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
		const nonWWhealing = this.uncategorized.heal + this.trackedOverheals.reduce((acc, entry) => {
			if (entry.idIsTracked(this.data.actions.WHITE_WIND.id)) {
				return acc
			}
			return acc + entry.heal
		}, 0)

		if (nonWWhealing !== 0) {
			return
		}

		this.suppressOutput = true
		this.displayChecklist = false
	}
}
