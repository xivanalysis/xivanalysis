import ACTIONS from 'data/ACTIONS'
import CoreCooldowns from 'parser/core/modules/Cooldowns'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		// Stance
		ACTIONS.ROYAL_GUARD.id,

		// Buffs
		ACTIONS.NO_MERCY.id,
		ACTIONS.BLOODFEST.id,

		// Continuation
		{
			name: 'Continuation',
			merge: true,
			actions: [
				ACTIONS.JUGULAR_RIP.id,
				ACTIONS.ABDOMEN_TEAR.id,
				ACTIONS.EYE_GOUGE.id,
			],
		},

		// oGCD Damage
		ACTIONS.DANGER_ZONE.id,
		ACTIONS.BLASTING_ZONE.id,
		ACTIONS.BOW_SHOCK.id,
		ACTIONS.ROUGH_DIVIDE.id,

		// Personal Mitigation
		ACTIONS.SUPERBOLIDE.id,
		ACTIONS.CAMOUFLAGE.id,
		ACTIONS.NEBULA.id,
		ACTIONS.RAMPART.id,

		// Party Mitigation
		ACTIONS.HEART_OF_LIGHT.id,
		ACTIONS.HEART_OF_STONE.id,
		ACTIONS.AURORA.id,
		ACTIONS.REPRISAL.id,

		// Tank Utility
		ACTIONS.PROVOKE.id,
		ACTIONS.SHIRK.id,

		// Disrupt Utility
		ACTIONS.INTERJECT.id,
		ACTIONS.LOW_BLOW.id,
		ACTIONS.ARMS_LENGTH.id,
	]
}
