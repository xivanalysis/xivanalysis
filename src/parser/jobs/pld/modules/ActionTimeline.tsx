import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,

		// Buffs
		'FIGHT_OR_FLIGHT',
		'REQUIESCAT',
		// oGCD Damage
		'SPIRITS_WITHIN',
		'CIRCLE_OF_SCORN',
		'INTERVENE',
		// Gauge Mitigation
		'SHELTRON',
		'INTERVENTION',
		// Personal Mitigation
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
