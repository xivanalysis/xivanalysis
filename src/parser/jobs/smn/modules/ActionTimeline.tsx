import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,
		{
			label: 'Energy Drain/Siphon',
			content: 'ENERGY_DRAIN',
		},
		'FESTER',
		'PAINFLARE',
		'BANE',
		{
			label: 'Trance',
			content: 'DREADWYRM_TRANCE',
		},
		'DEATHFLARE',
		'SUMMON_BAHAMUT',
		'ENKINDLE_BAHAMUT',
		'ENKINDLE_PHOENIX',
		'SUMMON',
		'EGI_ASSAULT',
		'EGI_ASSAULT_II',
		'ENKINDLE',
		'SMN_AETHERPACT',
		'TRI_DISASTER',
	]
}
