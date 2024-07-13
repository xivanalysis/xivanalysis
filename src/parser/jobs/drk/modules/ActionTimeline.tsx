import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,

		// Buffs
		'BLOOD_WEAPON',
		'DELIRIUM',
		// oGCD Damage
		'LIVING_SHADOW',
		'SHADOWBRINGER',
		'EDGE_OF_SHADOW',
		'FLOOD_OF_SHADOW',
		'CARVE_AND_SPIT',
		'ABYSSAL_DRAIN',
		['SALTED_EARTH', 'SALT_AND_DARKNESS'],
		// Personal Mitigation
		'LIVING_DEAD',
		'SHADOW_WALL',
		'RAMPART',
		'DARK_MIND',
		// Party Mitigation
		'THE_BLACKEST_NIGHT',
		'OBLATION',
		'REPRISAL',
		'DARK_MISSIONARY',
		// Tank Utility
		'PROVOKE',
		'SHIRK',
		// Disrupt Utility
		'INTERJECT',
		'LOW_BLOW',
	]
}
