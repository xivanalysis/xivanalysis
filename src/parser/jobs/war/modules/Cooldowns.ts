import ACTIONS from 'data/ACTIONS'
import CoreCooldowns from 'parser/core/modules/Cooldowns'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		// Buffs
		ACTIONS.INFURIATE.id,
		ACTIONS.INNER_RELEASE.id,
		// oGCD Damage
		ACTIONS.UPHEAVAL.id,
		ACTIONS.ONSLAUGHT.id,
		// Personal Mitigation
		ACTIONS.VENGEANCE.id,
		ACTIONS.RAMPART.id,
		ACTIONS.NASCENT_FLASH.id,
		ACTIONS.RAW_INTUITION.id,
		ACTIONS.THRILL_OF_BATTLE.id,
		ACTIONS.EQUILIBRIUM.id,
		ACTIONS.HOLMGANG.id,
		// Party Mitigation
		ACTIONS.SHAKE_IT_OFF.id,
		ACTIONS.REPRISAL.id,
		// Tank Utility
		ACTIONS.PROVOKE.id,
		ACTIONS.SHIRK.id,
		// Stance
		ACTIONS.DEFIANCE.id,
		// Disrupt Utility
		ACTIONS.INTERJECT.id,
		ACTIONS.LOW_BLOW.id,
	]
}
