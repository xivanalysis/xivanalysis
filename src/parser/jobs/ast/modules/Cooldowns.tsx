import CoreCooldowns, {CooldownOrderItem} from 'parser/core/modules/Cooldowns'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder: CooldownOrderItem[] = [
		// Arcanum
		{
			name: 'Draw/Undraw',
			actions: [
				'DRAW',
				'UNDRAW',
			],
		},
		{
			name: 'Redraw/Minor Arcana',
			actions: [
				'REDRAW',
				'MINOR_ARCANA',
			],
		},
		'SLEEVE_DRAW',
		{
			name: 'Play',
			actions: [
				'THE_BALANCE',
				'THE_BOLE',
				'THE_ARROW',
				'THE_SPEAR',
				'THE_EWER',
				'THE_SPIRE',
				'LORD_OF_CROWNS',
				'LADY_OF_CROWNS',
			],
		},
		'DIVINATION',
		'LIGHTSPEED',
		// oGCD ST heals
		'ESSENTIAL_DIGNITY',
		'CELESTIAL_INTERSECTION',
		'SYNASTRY',
		// oGCD AoE heals
		{
			name: 'Earthly Star',
			actions: [
				'EARTHLY_STAR',
				'STELLAR_DETONATION',
			],
		},
		'CELESTIAL_OPPOSITION',
		// Horoscope
		{
			name: 'Horoscope',
			actions: [
				'HOROSCOPE',
				'HOROSCOPE_ACTIVATION',
			],
		},
		// Party mitigation
		'COLLECTIVE_UNCONSCIOUS',
		// Healing buff
		'NEUTRAL_SECT',
		// Role actions
		'LUCID_DREAMING',
	]
}
