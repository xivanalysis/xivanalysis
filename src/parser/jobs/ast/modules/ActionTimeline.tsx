import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,
		// Arcanum
		['DRAW', 'UNDRAW'],
		'REDRAW',
		'SLEEVE_DRAW',
		'PLAY',
		'DIVINATION',
		'LIGHTSPEED',
		// oGCD ST heals
		'ESSENTIAL_DIGNITY',
		'CELESTIAL_INTERSECTION',
		'SYNASTRY',
		// oGCD AoE heals
		['EARTHLY_STAR', 'STELLAR_DETONATION'],
		'CELESTIAL_OPPOSITION',
		// Horoscope
		['HOROSCOPE', 'HOROSCOPE_ACTIVATION'],
		// Party mitigation
		'COLLECTIVE_UNCONSCIOUS',
		// Healing buff
		'NEUTRAL_SECT',
		// Role actions
		'LUCID_DREAMING',
	]
}
