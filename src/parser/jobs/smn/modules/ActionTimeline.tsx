import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,
		'SMN_MOUNTAIN_BUSTER',
		{
			label: 'Energy Drain/Siphon',
			content: 'SMN_ENERGY_DRAIN',
		},
		'FESTER',
		'PAINFLARE',
		{
			label: 'Demi',
			content: 'SUMMON_BAHAMUT',
		},
		'DEATHFLARE',
		'ENKINDLE_BAHAMUT',
		'ENKINDLE_PHOENIX',
		'REKINDLE',
		'SEARING_LIGHT',
		'RADIANT_AEGIS',
	]
}
