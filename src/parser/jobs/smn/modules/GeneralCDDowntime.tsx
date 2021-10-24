import {Event, Events} from 'event'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

export default class GeneralCDDowntime extends CooldownDowntime {

	trackedCds = [{
		cooldowns: [
			this.data.actions.DREADWYRM_TRANCE,
			this.data.actions.FIREBIRD_TRANCE,
		],
		firstUseOffset: 7500,
	}, {
		cooldowns: [
			this.data.actions.ENERGY_DRAIN,
			this.data.actions.ENERGY_SIPHON,
		],
		firstUseOffset: 2500,
	}, {
		cooldowns: [
			this.data.actions.ASSAULT_I_AERIAL_SLASH,
			this.data.actions.ASSAULT_I_EARTHEN_ARMOR,
			this.data.actions.ASSAULT_I_CRIMSON_CYCLONE,
		],
		firstUseOffset: 3500,
		// isAffectedBySpeed: true,
	}, {
		cooldowns: [
			this.data.actions.ASSAULT_II_SLIIPSTREAM,
			this.data.actions.ASSAULT_II_MOUNTAIN_BUSTER,
			this.data.actions.ASSAULT_II_FLAMING_CRUSH,
		],
		firstUseOffset: 3500,
		// isAffectedBySpeed: true,
	}, {
		cooldowns: [
			this.data.actions.ENKINDLE_AERIAL_BLAST,
			this.data.actions.ENKINDLE_EARTHEN_FURY,
			this.data.actions.ENKINDLE_INFERNO,
		],
		firstUseOffset: 9250,
	}, {
		cooldowns: [
			this.data.actions.SMN_AETHERPACT,
		],
		firstUseOffset: 6750,
	}]

	private devotionHook? : EventHook<Events['action']>

	override initialise() {
		super.initialise()

		const pets = this.parser.pull.actors
			.filter(actor => actor.owner === this.parser.actor)
			.map(actor => actor.id)
		this.devotionHook = this.addEventHook(
			filter<Event>()
				.source(oneOf(pets))
				.action(this.data.actions.DEVOTION.id)
				.type('action'),
			this.onAetherpactCast
		)
	}

	private onAetherpactCast(event: Events['action']) {
		// Egis will not execute an order while they are moving, so it is possible to
		// issue a pre-pull Aetherpact and delay the Devotion cast by the pet until
		// after the pull by running the pet in circles.  Such casts will not be detected
		// by PrecastStatus, since the status is applied post-pull.

		if (event.timestamp < this.parser.pull.timestamp) {
			const modified = {...event}
			modified.action = this.data.actions.SMN_AETHERPACT.id
			this.onTrackedCast(modified)
		}

		if (this.devotionHook != null) {
			this.removeEventHook(this.devotionHook)
			this.devotionHook = undefined
		}
	}
}
