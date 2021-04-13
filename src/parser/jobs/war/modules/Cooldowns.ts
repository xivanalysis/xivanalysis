import CoreCooldowns, {CooldownOrderItem} from 'parser/core/modules/Cooldowns'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder: CooldownOrderItem[] = [
		// Buffs
		'INFURIATE',
		'INNER_RELEASE',
		// oGCD Damage
		'UPHEAVAL',
		'ONSLAUGHT',
		// Personal Mitigation
		'VENGEANCE',
		'RAMPART',
		'NASCENT_FLASH',
		'RAW_INTUITION',
		'THRILL_OF_BATTLE',
		'EQUILIBRIUM',
		'HOLMGANG',
		// Party Mitigation
		'SHAKE_IT_OFF',
		'REPRISAL',
		// Tank Utility
		'PROVOKE',
		'SHIRK',
		// Stance
		'DEFIANCE',
		// Disrupt Utility
		'INTERJECT',
		'LOW_BLOW',
	]
}
