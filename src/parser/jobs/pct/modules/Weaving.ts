import {BASE_GCD} from 'data/CONSTANTS'
import {Weaving as CoreWeaving, Weave} from 'parser/core/modules/Weaving'
import {MOTIFS, SUBTRACTIVE_SPELLS} from './CommonData'
import DISPLAY_ORDER from './DISPLAY_ORDER'

// most animations lock the user out of another action for a total of 600ms
const ANIMATION_LOCK = 600

export default class Weaving extends CoreWeaving {
	static override displayOrder = DISPLAY_ORDER.WEAVING

	private longCastIds = [
		...MOTIFS.map(key => this.data.actions[key].id),
		...SUBTRACTIVE_SPELLS.map(key => this.data.actions[key].id),
		this.data.actions.RAINBOW_DRIP.id,
	]

	// Star Prism's cure isn't a real action, it can't hurt you
	override ignoredActionIds = [this.data.actions.STAR_PRISM_CURE.id]

	override getMaxWeaves(weave: Weave) {

		// If this isn't one of the funky long GCDs, use the default Weaving behavior
		if (!this.longCastIds.includes(weave.leadingGcdEvent.action)) {
			return super.getMaxWeaves(weave)
		}

		// Calculate the actual interval weaves were available after the leading GCD event.
		const castTime = this.castTime.forEvent(weave.leadingGcdEvent) ?? 0
		const recastTime = this.castTime.recastForEvent(weave.leadingGcdEvent) ?? BASE_GCD
		// Exclude the leading GCDs own animation from the interval
		const weaveInterval = recastTime - castTime - ANIMATION_LOCK

		// How many weaves can fit in this interval? Round to nearest cause this is all kinda handwavy
		const maxAllowableWeaves = Math.round(weaveInterval / ANIMATION_LOCK)

		return maxAllowableWeaves
	}
}
