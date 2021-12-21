import {Event, Events} from 'event'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

export default class GeneralCDDowntime extends CooldownDowntime {

	trackedCds = [{
		cooldowns: [
			this.data.actions.SMN_ENERGY_DRAIN,
			this.data.actions.ENERGY_SIPHON,
		],
		firstUseOffset: 2500,
	}, {
		cooldowns: [
			this.data.actions.SEARING_LIGHT,
		],
		firstUseOffset: 6750,
	}]

	private slHook? : EventHook<Events['action']>

	override initialise() {
		super.initialise()

		const pets = this.parser.pull.actors
			.filter(actor => actor.owner === this.parser.actor)
			.map(actor => actor.id)
		this.slHook = this.addEventHook(
			filter<Event>()
				.source(oneOf(pets))
				.action(this.data.actions.PET_SEARING_LIGHT.id)
				.type('action'),
			this.onSearingLightCast
		)
	}

	private onSearingLightCast(event: Events['action']) {
		// Egis will not execute an order while they are moving, so it is possible to
		// issue a pre-pull Searing Light and delay the pet's cast by the pet until
		// after the pull by running the pet in circles.  Such casts will not be detected
		// by PrecastStatus, since the status is applied post-pull.

		if (event.timestamp < this.parser.pull.timestamp) {
			const modified = {...event}
			modified.action = this.data.actions.SEARING_LIGHT.id
			this.onTrackedCast(modified)
		}

		if (this.slHook != null) {
			this.removeEventHook(this.slHook)
			this.slHook = undefined
		}
	}
}
