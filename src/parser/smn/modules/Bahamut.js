import Module from '@/parser/core/Module'

import ACTIONS from '@/data/ACTIONS'

export default class Bahamut extends Module {
	static dependencies = [
		'gauge'
	]

	counting = false
	wyrmwaveCount = 0
	akhMornCount = 0

	// TODO: Limit to pet only?
	on_damage(event) {
		const abilityId = event.ability.guid

		// Track casts - these only happen during the summon window so w/e
		// TODO: Probably should have _some_ handling for shit outside the window 'cus that's jank
		if (abilityId === ACTIONS.WYRMWAVE.id) {
			this.wyrmwaveCount ++
		}

		if (abilityId === ACTIONS.AKH_MORN.id) {
			this.akhMornCount ++
		}

		// Set this up so we know that something's started
		if (!this.counting && this.gauge.bahamutSummoned()) {
			this.counting = true
		}

		// Aaaand pull it apart again once we're done
		if (this.counting && !this.gauge.bahamutSummoned()) {
			this.counting = false
			console.log('ww', this.wyrmwaveCount)
			console.log('am', this.akhMornCount)
			this.wyrmwaveCount = 0
			this.akhMornCount = 0
		}
	}
}
