import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,

		// Buffs
		'FIGHT_OR_FLIGHT',
		'REQUIESCAT',
		// oGCD Damage
		'EXPIACION',
		'CIRCLE_OF_SCORN',
		'INTERVENE',
		// Gauge Mitigation
		'HOLY_SHELTRON',
		'INTERVENTION',
		// Personal Mitigation
		'BULWARK',
		'HALLOWED_GROUND',
		'SENTINEL',
		'RAMPART',
		// Personal Utility
		'ARMS_LENGTH',
		// Party Mitigation
		'PASSAGE_OF_ARMS',
		'DIVINE_VEIL',
		'REPRISAL',
		'COVER',
		// Tank Utility
		'PROVOKE',
		'SHIRK',
		// Disrupt Utility
		'INTERJECT',
		'LOW_BLOW',
	]
}
