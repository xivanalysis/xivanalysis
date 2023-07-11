import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,

		// Buffs
		'INFURIATE',
		'INNER_RELEASE',

		// oGCD Damage
		['UPHEAVAL', 'OROGENY'],
		'ONSLAUGHT',

		// Personal Mitigation
		'VENGEANCE',
		'RAMPART',
		'NASCENT_FLASH',
		'BLOODWHETTING',
		'THRILL_OF_BATTLE',
		'EQUILIBRIUM',
		'HOLMGANG',

		// Party Mitigation
		'SHAKE_IT_OFF',
		'REPRISAL',

		// Tank Utility
		'PROVOKE',
		'SHIRK',
		// Stance
		'DEFIANCE',

		// Disrupt Utility
		'INTERJECT',
		'LOW_BLOW',
	]
}
