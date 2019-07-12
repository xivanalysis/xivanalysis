import ACTIONS from 'data/ACTIONS'
import CoreCooldowns from 'parser/core/modules/Cooldowns'
import {PLAY} from './ArcanaGroups'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		// Arcanum
		{
			name: 'Draw',
			merge: true,
			actions: [
				ACTIONS.DRAW.id,
				ACTIONS.REDRAW.id,
				ACTIONS.UNDRAW.id,
				ACTIONS.MINOR_ARCANA.id,
			],
		},
		ACTIONS.SLEEVE_DRAW.id,
		{
			name: 'Play',
			merge: true,
			actions: [...PLAY],
		},
		ACTIONS.DIVINATION.id,
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
