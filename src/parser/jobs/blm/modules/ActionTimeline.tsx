import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,
		'TRANSPOSE',
		'TRIPLECAST',
		'SWIFTCAST',
		'AMPLIFIER',
		'LEY_LINES',
		'SHARPCAST',
		'LUCID_DREAMING',
		'MANAFONT',
		'ADDLE',
		'MANAWARD',
		'SURECAST',
		'AETHERIAL_MANIPULATION',
		'BETWEEN_THE_LINES',
	]
}
