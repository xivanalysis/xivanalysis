import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,

		'SUBTRACTIVE_PALETTE',
		{
			content: ['MOG_OF_THE_AGES', 'RETRIBUTION_OF_THE_MADEEN'],
		},
		{
			content: ['POM_MUSE', 'WINGED_MUSE', 'CLAWED_MUSE', 'FANGED_MUSE'],
		},
		'STRIKING_MUSE',
		'STARRY_MUSE',
		'SWIFTCAST',
		'TEMPERA_COAT',
		'TEMPERA_GRASSA',
		'ADDLE',
		'LUCID_DREAMING',
		'SURECAST',
		'SMUDGE',
	]
}
