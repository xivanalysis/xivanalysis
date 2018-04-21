import Module from '@/parser/core/Module'

export default class Combatant extends Module {
	// TODO: Should probably abstract generic handling out of this so can use for enemies too

	// TODO: tempted to store a history and use it for comparisons
	resources = {}

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
}
