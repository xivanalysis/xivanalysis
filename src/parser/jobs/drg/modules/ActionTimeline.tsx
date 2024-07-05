import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,
		'BATTLE_LITANY',
		'LANCE_CHARGE',
		'LIFE_SURGE',
		'JUMP',
		'HIGH_JUMP',
		'MIRAGE_DIVE',
		'DRAGONFIRE_DIVE',
		'RISE_OF_THE_DRAGON',
		'GEIRSKOGUL',
		'NASTROND',
		'STARDIVER',
		'STARCROSS',
		'ELUSIVE_JUMP',
		'WINGED_GLIDE',
	]
}
