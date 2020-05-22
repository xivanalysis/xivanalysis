import CoreCooldowns from 'parser/core/modules/Cooldowns'
import ACTIONS from 'data/ACTIONS'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		// Stance
		ACTIONS.DEFIANCE.id,
		// Buffs
		ACTIONS.INNER_RELEASE.id,
		ACTIONS.INFURIATE.id,
		// oGCD Damage
		ACTIONS.UPHEAVAL.id,
		ACTIONS.ONSLAUGHT.id,
		// Personal Mitigation
		ACTIONS.HOLMGANG.id,
		ACTIONS.VENGEANCE.id,
		ACTIONS.RAMPART.id,
		ACTIONS.THRILL_OF_BATTLE.id,
		ACTIONS.RAW_INTUITION.id,
		ACTIONS.EQUILIBRIUM.id,
		// Party Mitigation
		ACTIONS.SHAKE_IT_OFF.id,
		ACTIONS.REPRISAL.id,
		// Tank Utility
		ACTIONS.PROVOKE.id,
		ACTIONS.SHIRK.id,
		// Disrupt Utility
		ACTIONS.INTERJECT.id,
		ACTIONS.LOW_BLOW.id,
	]
}
