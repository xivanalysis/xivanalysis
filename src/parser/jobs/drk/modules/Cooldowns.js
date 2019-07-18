import CoreCooldowns from 'parser/core/modules/Cooldowns'
import ACTIONS from 'data/ACTIONS'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		// Buffs
		ACTIONS.BLOOD_WEAPON.id,
		ACTIONS.DELIRIUM.id,
		// oGCD Damage
		ACTIONS.EDGE_OF_SHADOW.id,
		ACTIONS.FLOOD_OF_SHADOW.id,
		ACTIONS.LIVING_SHADOW.id,
		ACTIONS.CARVE_AND_SPIT.id,
		ACTIONS.PLUNGE.id,
		ACTIONS.SALTED_EARTH.id,
		ACTIONS.ABYSSAL_DRAIN.id,
		// Personal Mitigation
		ACTIONS.LIVING_DEAD.id,
		ACTIONS.SHADOW_WALL.id,
		ACTIONS.RAMPART.id,
		ACTIONS.DARK_MIND.id,
		// Party Mitigation
		ACTIONS.THE_BLACKEST_NIGHT.id,
		ACTIONS.REPRISAL.id,
		ACTIONS.DARK_MISSIONARY.id,
		// Tank Utility
		ACTIONS.PROVOKE.id,
		ACTIONS.SHIRK.id,
		// Disrupt Utility
		ACTIONS.INTERJECT.id,
		ACTIONS.LOW_BLOW.id,
	]
}
