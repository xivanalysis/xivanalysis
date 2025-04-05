import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'

export class Defensives extends CoreDefensives {
	protected override trackedActions = [
		this.data.actions.CELESTIAL_INTERSECTION,
		this.data.actions.CELESTIAL_OPPOSITION,
		this.data.actions.EARTHLY_STAR,
		this.data.actions.MACROCOSMOS,
		this.data.actions.EXALTATION,
		this.data.actions.HOROSCOPE,
		this.data.actions.NEUTRAL_SECT,
		this.data.actions.COLLECTIVE_UNCONSCIOUS,
		this.data.actions.LIGHTSPEED,
		this.data.actions.SWIFTCAST,
	]
}
