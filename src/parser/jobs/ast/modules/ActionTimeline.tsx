import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,
		// Arcanum
		['PLAY_I', 'PLAY_II', 'PLAY_III'],
		'MINOR_ARCANA',
		//other AST or party buffs
		['ASTRAL_DRAW', 'UMBRAL_DRAW'],
		['DIVINATION', 'ORACLE'],
		'LIGHTSPEED',
		// oGCD ST heals
		'ESSENTIAL_DIGNITY',
		'SYNASTRY',
		'CELESTIAL_INTERSECTION',
		// oGCD AoE heals
		'CELESTIAL_OPPOSITION',
		['EARTHLY_STAR', 'STELLAR_DETONATION'],
		//Delayed oGCD Heals
		['MACROCOSMOS', 'MICROCOSMOS'],
		'EXALTATION',
		['HOROSCOPE', 'HOROSCOPE_ACTIVATION'],
		// Healing buff
		'NEUTRAL_SECT',
		// Party mitigation
		'COLLECTIVE_UNCONSCIOUS',
		'SUN_SIGN',
		// Role actions
		'LUCID_DREAMING',
	]
}
