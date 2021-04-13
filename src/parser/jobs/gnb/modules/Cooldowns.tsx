import CoreCooldowns, {CooldownOrderItem} from 'parser/core/modules/Cooldowns'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder: CooldownOrderItem[] = [
		// Stance
		'ROYAL_GUARD',

		// Buffs
		'NO_MERCY',
		'BLOODFEST',

		// Continuation
		{
			name: 'Continuation',
			actions: [
				'JUGULAR_RIP',
				'ABDOMEN_TEAR',
				'EYE_GOUGE',
			],
		},

		// oGCD Damage
		'DANGER_ZONE',
		'BLASTING_ZONE',
		'BOW_SHOCK',
		'ROUGH_DIVIDE',

		// Personal Mitigation
		'SUPERBOLIDE',
		'CAMOUFLAGE',
		'NEBULA',
		'RAMPART',

		// Party Mitigation
		'HEART_OF_LIGHT',
		'HEART_OF_STONE',
		'AURORA',
		'REPRISAL',

		// Tank Utility
		'PROVOKE',
		'SHIRK',

		// Disrupt Utility
		'INTERJECT',
		'LOW_BLOW',
		'ARMS_LENGTH',
	]
}
