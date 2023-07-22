import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,
		'TRANSPOSE',
		'TRIPLECAST',
		'SWIFTCAST',
		'AMPLIFIER',
		'MANAFONT',
		'LEY_LINES',
		'SHARPCAST',
		'ADDLE',
		'MANAWARD',
		'SURECAST',
		'AETHERIAL_MANIPULATION',
		'BETWEEN_THE_LINES',
	]
}
