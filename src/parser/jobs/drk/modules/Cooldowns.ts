import ACTIONS from 'data/ACTIONS'
import CoreCooldowns from 'parser/core/modules/Cooldowns'

export class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		// Buffs
		ACTIONS.BLOOD_WEAPON.id,
		ACTIONS.DELIRIUM.id,
		// oGCD Damage
		ACTIONS.LIVING_SHADOW.id,
		ACTIONS.EDGE_OF_SHADOW.id,
		ACTIONS.FLOOD_OF_SHADOW.id,
		ACTIONS.CARVE_AND_SPIT.id,
		ACTIONS.ABYSSAL_DRAIN.id,
		ACTIONS.PLUNGE.id,
		ACTIONS.SALTED_EARTH.id,
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
