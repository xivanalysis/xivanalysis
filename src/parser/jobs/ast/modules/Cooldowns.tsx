import ACTIONS from 'data/ACTIONS'
import CoreCooldowns from 'parser/core/modules/Cooldowns'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		ACTIONS.DRAW.id,
		// oGCD ST heals
		ACTIONS.ESSENTIAL_DIGNITY.id,
		ACTIONS.CELESTIAL_INTERSECTION.id,
		// oGCD AoE heals
		ACTIONS.EARTHLY_STAR.id,
		ACTIONS.CELESTIAL_OPPOSITION.id,
		// Horoscope
		{
			name: 'Horoscope',
			merge: true,
			actions: [
				ACTIONS.HOROSCOPE.id,
				ACTIONS.HOROSCOPE_ACTIVATION.id,
			],
		},
		// Party mitigation
		ACTIONS.COLLECTIVE_UNCONSCIOUS.id,
		// Healing buff
		ACTIONS.NEUTRAL_SECT.id,
		// Role actions
		ACTIONS.LUCID_DREAMING.id,
	]
}
