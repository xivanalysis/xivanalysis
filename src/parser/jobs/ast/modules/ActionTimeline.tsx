import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,
		// Arcanum
		['DRAW', 'UNDRAW'],
		'PLAY',
		'CROWN_PLAY',
		'ASTRODYNE',
		//other AST or party buffs
		'DIVINATION',
		'LIGHTSPEED',
		// oGCD ST heals
		'ESSENTIAL_DIGNITY',
		'CELESTIAL_INTERSECTION',
		'SYNASTRY',
		'EXALTATION',
		// oGCD AoE heals
		['EARTHLY_STAR', 'STELLAR_DETONATION'],
		'CELESTIAL_OPPOSITION',
		// Horoscope
		['HOROSCOPE', 'HOROSCOPE_ACTIVATION'],
		// Party mitigation
		'COLLECTIVE_UNCONSCIOUS',
		['MACROCOSMOS', 'MICROCOSMOS'],
		// Healing buff
		'NEUTRAL_SECT',
		// Role actions
		'LUCID_DREAMING',
	]
}
