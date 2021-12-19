import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,
		'BATTLE_LITANY',
		'DRAGON_SIGHT',
		'LANCE_CHARGE',
		'JUMP',
		'HIGH_JUMP',
		'MIRAGE_DIVE',
		'GEIRSKOGUL',
		'NASTROND',
		'STARDIVER',
		'SPINESHATTER_DIVE',
		'DRAGONFIRE_DIVE',
		'LIFE_SURGE',
		'ELUSIVE_JUMP',
	]
}
