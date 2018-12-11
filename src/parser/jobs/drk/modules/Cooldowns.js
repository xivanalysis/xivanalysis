import CoreCooldowns from 'parser/core/modules/Cooldowns'
import ACTIONS from 'data/ACTIONS'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		// Stance
		ACTIONS.DARKSIDE.id,
		// Buffs
		ACTIONS.DARK_ARTS.id,
		ACTIONS.BLOOD_WEAPON.id,
		ACTIONS.BLOOD_PRICE.id,
		ACTIONS.DELIRIUM.id,
		ACTIONS.SOLE_SURVIVOR.id,
		// oGCD Damage
		ACTIONS.SALTED_EARTH.id,
		ACTIONS.CARVE_AND_SPIT.id,
		ACTIONS.PLUNGE.id,
		ACTIONS.DARK_PASSENGER.id,
		// Personal Mitigation
		ACTIONS.LIVING_DEAD.id,
		ACTIONS.SHADOW_WALL.id,
		ACTIONS.RAMPART.id,
		ACTIONS.DARK_MIND.id,
		ACTIONS.CONVALESCENCE.id,
		ACTIONS.AWARENESS.id,
		ACTIONS.ANTICIPATION.id,
		// Party Mitigation
		ACTIONS.THE_BLACKEST_NIGHT.id,
		ACTIONS.REPRISAL.id,
		// Tank Utility
		ACTIONS.PROVOKE.id,
		ACTIONS.ULTIMATUM.id,
		ACTIONS.SHIRK.id,
		// Disrupt Utility
		ACTIONS.INTERJECT.id,
		ACTIONS.LOW_BLOW.id,
	]
}
