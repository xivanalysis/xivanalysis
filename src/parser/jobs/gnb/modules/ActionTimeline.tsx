import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,

		// Stance
		'ROYAL_GUARD',

		// Buffs
		'NO_MERCY',
		'BLOODFEST',

		// Continuation
		'CONTINUATION',

		// oGCD Damage
		'DANGER_ZONE',
		'BLASTING_ZONE',
		'BOW_SHOCK',
		'TRAJECTORY',

		// Personal Mitigation
		'SUPERBOLIDE',
		'CAMOUFLAGE',
		'NEBULA',
		'GREAT_NEBULA',
		'RAMPART',

		// Party Mitigation
		'HEART_OF_LIGHT',
		'HEART_OF_STONE',
		'HEART_OF_CORUNDUM',
		'AURORA',
		'REPRISAL',

		// Tank Utility
		'PROVOKE',
		'SHIRK',

		// Disrupt Utility
		'INTERJECT',
		'LOW_BLOW',
		'ARMS_LENGTH',
	]
}
