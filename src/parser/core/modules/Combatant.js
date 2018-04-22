import Module from '@/parser/core/Module'

export default class Combatant extends Module {
	// TODO: Should probably abstract generic handling out of this so can use for enemies too

	// -----
	// Properties
	// -----

	// TODO: tempted to store a history and use it for comparisons
	resources = {}
	statuses = {}

	// -----
	// Events
	// -----

	on_damage_byPlayer(event) {
		// Some byPlayer damage events don't have resources 'cus they're ticks or w/e
		if (!event.sourceResources) { return }
		this.resources = event.sourceResources
	}
	on_damage_toPlayer(event) {
		this.resources = event.targetResources
	}
	on_heal_toPlayer(event) {
		this.resources = event.targetResources
	}

	on_applybuff_toPlayer(event) {
		// TODO: Should I store more than this?
		//       ...maybe stack info from applybuffstack/removebuffstack?
		this.statuses[event.ability.guid] = true
	}
	on_removebuff_toPlayer(event) {
		delete this.statuses[event.ability.guid]
	}
	on_applydebuff_toPlayer(event) {
		// TODO: Combine these a bit, it's just duping shit up
		this.statuses[event.ability.guid] = true
	}
	on_removedebuff_toPlayer(event) {
		delete this.statuses[event.ability.guid]
	}
}
