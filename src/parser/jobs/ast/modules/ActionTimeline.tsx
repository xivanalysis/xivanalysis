import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,
		// Arcanum
		['DRAW', 'UNDRAW'],
		'PLAY',
		'ASTRODYNE',
		['CROWN_PLAY', 'MINOR_ARCANA'],
		//other AST or party buffs
		'DIVINATION',
		'LIGHTSPEED',
		// oGCD ST heals
		'ESSENTIAL_DIGNITY',
		'SYNASTRY',
		'CELESTIAL_INTERSECTION',
		// oGCD AoE heals
		'CELESTIAL_OPPOSITION',
		['EARTHLY_STAR', 'STELLAR_DETONATION'],
		//Delayed Heals
		['MACROCOSMOS', 'MICROCOSMOS'],
		'EXALTATION',
		['HOROSCOPE', 'HOROSCOPE_ACTIVATION'],
		// Party mitigation
		'COLLECTIVE_UNCONSCIOUS',
		// Healing buff
		'NEUTRAL_SECT',
		// Role actions
		'LUCID_DREAMING',
	]
}
