import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,
		'BARRAGE',
		'RAGING_STRIKES',
		'BATTLE_VOICE',
		'RADIANT_FINALE',
		'BLOODLETTER',
		{
			label: 'Songs',
			content: [
				'THE_WANDERERS_MINUET',
				'MAGES_BALLAD',
				'ARMYS_PAEON',
			],
		},
		'EMPYREAL_ARROW',
		'SIDEWINDER',
		'PITCH_PERFECT',
		'TROUBADOUR',
		'NATURES_MINNE',
		'THE_WARDENS_PAEAN',
		'REPELLING_SHOT',
	]
}
