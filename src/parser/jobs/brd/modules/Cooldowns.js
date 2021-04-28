import CoreCooldowns from 'parser/core/modules/Cooldowns'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		'BARRAGE',
		'RAGING_STRIKES',
		'BATTLE_VOICE',
		{
			name: 'Bloodletter',
			actions: [
				'BLOODLETTER',
				'RAIN_OF_DEATH',
			],
		},
		{
			name: 'Songs',
			actions: [
				'THE_WANDERERS_MINUET',
				'MAGES_BALLAD',
				'ARMYS_PAEON',
			],
		},
		'EMPYREAL_ARROW',
		{
			name: 'Sidewinder',
			actions: [
				'SIDEWINDER',
				'SHADOWBITE',
			],
		},
		'PITCH_PERFECT',
		'TROUBADOUR',
		'NATURES_MINNE',
		'THE_WARDENS_PAEAN',
		'REPELLING_SHOT',
	]
}
