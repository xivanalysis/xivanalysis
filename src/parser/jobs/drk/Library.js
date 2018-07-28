import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'

export default class Library extends Module {
	static handle = 'library'

	constructor(...args) {
		super(...args)
		// this.addHook('init', this._onInit)
	}

	// noinspection JSMethodCanBeStatic
	upperCap(value, cap) {
		return value > cap ? cap : value
	}

	// -----
	// Timers
	// -----
	DARK_ARTS_DURATION = 10000
	// -----
	// Action info
	// -----
	// Things that should get flagged if they show up under grit and darkside
	// Later on, this should be a map of potency loss and hate bonus
	OFFENSIVE_ACTIONS = [
		//gcd
		//combo
		ACTIONS.HARD_SLASH.id,
		ACTIONS.SYPHON_STRIKE.id,
		ACTIONS.SOULEATER.id,
		ACTIONS.SPINNING_SLASH.id,
		ACTIONS.POWER_SLASH.id,
		//blood
		ACTIONS.BLOODSPILLER.id,
		ACTIONS.QUIETUS.id,
		//non combo
		ACTIONS.UNLEASH.id,
		ACTIONS.UNMEND.id,
		ACTIONS.ABYSSAL_DRAIN.id,
		//ogcd
		ACTIONS.PLUNGE.id,
		ACTIONS.CARVE_AND_SPIT.id,
		ACTIONS.DARK_PASSENGER.id,
		ACTIONS.SALTED_EARTH.id,
	]

	// actions that consume DA status
	DARK_ARTS_CONSUMERS = [
		ACTIONS.SYPHON_STRIKE.id,
		ACTIONS.SOULEATER.id,
		ACTIONS.SPINNING_SLASH.id,
		ACTIONS.POWER_SLASH.id,
		ACTIONS.DARK_PASSENGER.id,
		ACTIONS.PLUNGE.id,
		ACTIONS.ABYSSAL_DRAIN.id,
		ACTIONS.CARVE_AND_SPIT.id,
		ACTIONS.QUIETUS.id,
		ACTIONS.BLOODSPILLER.id,
	]
}
