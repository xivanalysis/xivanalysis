import ACTIONS from 'data/ACTIONS'
import CoreCooldowns from 'parser/core/modules/Cooldowns'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		// Arcanum
		{
			name: 'Draw/Undraw',
			merge: true,
			actions: [
				ACTIONS.DRAW.id,
				ACTIONS.UNDRAW.id,
			],
		},
		{
			name: 'Redraw/Minor Arcana',
			merge: true,
			actions: [
				ACTIONS.REDRAW.id,
				ACTIONS.MINOR_ARCANA.id,
			],
		},
		ACTIONS.SLEEVE_DRAW.id,
		{
			name: 'Play',
			merge: true,
			actions: [
				ACTIONS.THE_BALANCE.id,
				ACTIONS.THE_BOLE.id,
				ACTIONS.THE_ARROW.id,
				ACTIONS.THE_SPEAR.id,
				ACTIONS.THE_EWER.id,
				ACTIONS.THE_SPIRE.id,
				ACTIONS.LORD_OF_CROWNS.id,
				ACTIONS.LADY_OF_CROWNS.id,
			],
		},
		ACTIONS.DIVINATION.id,
		ACTIONS.LIGHTSPEED.id,
		// oGCD ST heals
		ACTIONS.ESSENTIAL_DIGNITY.id,
		ACTIONS.CELESTIAL_INTERSECTION.id,
		ACTIONS.SYNASTRY.id,
		// oGCD AoE heals
		{
			name: 'Earthly Star',
			merge: true,
			actions: [
				ACTIONS.EARTHLY_STAR.id,
				ACTIONS.STELLAR_DETONATION.id,
			],
		},
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
