import ACTIONS from 'data/ACTIONS'

export default {

	// -----
	// Meters
	// ------
	MAX_BLOOD: 100,
	MAX_MANA: 9480,
	MANA_PER_OUT_OF_COMBAT_TICK: 568, // DA is used 1-3 ticks pre pull, if at all. Good to have regardless
	// -----
	// Timers
	// -----
	GCD_COMBO_DURATION: 10000,
	DARK_ARTS_DURATION: 10000,
	THE_BLACKEST_NIGHT_DURATION: 5000,
	BLOOD_PRICE_BLOOD_PASSIVE_RATE: 3000,
	BLOOD_PRICE_BLOOD_PASSIVE_AMOUNT: 4,
	// -----
	// Other Globals
	// -----
	BLOOD_PRICE_BLOOD_DAMAGE_TRIGGERED_AMOUNT: 1,
	// -----
	// Functions
	// -----
	/**
	 * Ceiling bound adding function
	 * @param current operand 1
	 * @param value operand 2
	 * @param ceiling ceiling
	 * @returns {{waste: number, result: *}} tuple of new bounded result and any capped amount left over
	 */
	bindValueToCeiling(current, value, ceiling) {
		const waste = current + value > ceiling ? current + value - ceiling : 0
		const result = current + value > ceiling ? ceiling : current + value
		return {waste: waste, result: result}
	},
	// -----
	// Action info
	// -----
	// Things that should get flagged if they show up under grit and darkside
	// Later on, this should be a map of potency loss and hate bonus
	OFFENSIVE_ACTIONS: [
		//gcd
		//combo
		ACTIONS.HARD_SLASH,
		ACTIONS.SYPHON_STRIKE,
		ACTIONS.SOULEATER,
		ACTIONS.SPINNING_SLASH,
		ACTIONS.POWER_SLASH,
		//blood
		ACTIONS.BLOODSPILLER,
		ACTIONS.QUIETUS,
		//non combo
		ACTIONS.UNLEASH,
		ACTIONS.UNMEND,
		ACTIONS.ABYSSAL_DRAIN,
		//ogcd
		ACTIONS.PLUNGE,
		ACTIONS.CARVE_AND_SPIT,
		ACTIONS.DARK_PASSENGER,
		ACTIONS.SALTED_EARTH,
	],

	// actions that consume DA status
	DARK_ARTS_CONSUMERS: [
		ACTIONS.SYPHON_STRIKE,
		ACTIONS.SOULEATER,
		ACTIONS.SPINNING_SLASH,
		ACTIONS.POWER_SLASH,
		ACTIONS.DARK_PASSENGER,
		ACTIONS.PLUNGE,
		ACTIONS.ABYSSAL_DRAIN,
		ACTIONS.CARVE_AND_SPIT,
		ACTIONS.QUIETUS,
		ACTIONS.BLOODSPILLER,
	],

	// GCD Combo affecting actions.
	GCD_COMBO_ACTIONS: [
		ACTIONS.HARD_SLASH,
		ACTIONS.SYPHON_STRIKE,
		ACTIONS.SOULEATER,
		ACTIONS.SPINNING_SLASH,
		ACTIONS.POWER_SLASH,
		ACTIONS.UNMEND,
		ACTIONS.ABYSSAL_DRAIN,
	],
	// GCD Combo Chain.  If this chain isn't respected, all additional effects of attacks are discarded.
	GCD_COMBO_CHAIN: [
		{current: ACTIONS.SYPHON_STRIKE, requires: [ACTIONS.HARD_SLASH]},
		{current: ACTIONS.SOULEATER, requires: [ACTIONS.SYPHON_STRIKE]},
		{current: ACTIONS.SPINNING_SLASH, requires: [ACTIONS.HARD_SLASH]},
		{current: ACTIONS.POWER_SLASH, requires: [ACTIONS.SPINNING_SLASH]},
	],

	// Actions that change the blood gauge
	BLOOD_MODIFIERS: [
		// generators
		{id: ACTIONS.SOULEATER, value: 10},
		// spenders
		{id: ACTIONS.BLOODSPILLER, value: -50},
		{id: ACTIONS.QUIETUS, value: -50},
		{id: ACTIONS.DELIRIUM, value: -50},
	],
	THE_BLACKEST_NIGHT_BLOOD_CONDITIONAL_GENERATION: 50,

	MANA_MODIFIERS: [
		// generators
		{id: ACTIONS.SYPHON_STRIKE, value: 1200},
		{id: ACTIONS.DELIRIUM, value: 2400},
		// spenders
		{id: ACTIONS.DARK_ARTS, value: -2400},
		{id: ACTIONS.DARK_PASSENGER, value: -2400},
		{id: ACTIONS.THE_BLACKEST_NIGHT, value: -2400},
		{id: ACTIONS.ABYSSAL_DRAIN, value: -1320},
		{id: ACTIONS.UNLEASH, value: -1080},
	],

	// Actions that generate blood and mana under blood weapon (Physical Damage actions - 3 blood, 480mp).
	// redundant, but this keeps consistency with the other mappings
	BLOOD_WEAPON_GENERATORS: [
		// Auto
		{id: ACTIONS.ATTACK, mana: 480, blood: 3},
		// Combo GCDs
		{id: ACTIONS.HARD_SLASH, mana: 480, blood: 3},
		{id: ACTIONS.SYPHON_STRIKE, mana: 480, blood: 3},
		{id: ACTIONS.SOULEATER, mana: 480, blood: 3},
		{id: ACTIONS.SPINNING_SLASH, mana: 480, blood: 3},
		{id: ACTIONS.POWER_SLASH, mana: 480, blood: 3},
		// other GCDs
		{id: ACTIONS.BLOODSPILLER, mana: 480, blood: 3},
		{id: ACTIONS.QUIETUS, mana: 480, blood: 3},
		// oGCDs
		{id: ACTIONS.PLUNGE, mana: 480, blood: 3},
		{id: ACTIONS.CARVE_AND_SPIT, mana: 480, blood: 3},
	],

	// Actions that generate blood and mana under grit.
	GRIT_GENERATORS: [
		{id: ACTIONS.SYPHON_STRIKE, mana: 1200, blood: 0},
	],
}
