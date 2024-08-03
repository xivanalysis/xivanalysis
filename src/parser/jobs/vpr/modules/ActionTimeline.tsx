import {Trans} from '@lingui/react'
import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'
import React from 'react'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,
		'DEATH_RATTLE',
		'SERPENTS_IRE',
		{
			label: <Trans id="vpr.action-timeline.dreadwinder">Vicewinder Combo</Trans>,
			content: [
				'VICEWINDER',
				'HUNTERS_COIL',
				'SWIFTSKINS_COIL',
				'VICEPIT',
				'HUNTERS_DEN',
				'SWIFTSKINS_DEN',
			],
		},
		{
			label: <Trans id="vpr.action-timeline.dreadwinder-procs">Vicewinder Procs</Trans>,
			content: [
				'TWINFANG_BITE',
				'TWINBLOOD_BITE',
			],
		},
		'UNCOILED_FURY',
		{
			label: <Trans id="vpr.action-timeline.uncoiled-procs">Uncoiled Procs</Trans>,
			content: [
				'UNCOILED_TWINFANG',
				'UNCOILED_TWINBLOOD',
			],
		},
		{
			label: <Trans id="vpr.action-timeline.reawaken-combo">Reawaken Combo</Trans>,
			content: [
				'REAWAKEN',
				'FIRST_GENERATION',
				'SECOND_GENERATION',
				'THIRD_GENERATION',
				'FOURTH_GENERATION',
				'OUROBOROS',
			],
		},
		{
			label: <Trans id="vpr.action-timeline.reawaken-procs">Reawaken Procs</Trans>,
			content: [
				'FIRST_LEGACY',
				'SECOND_LEGACY',
				'THIRD_LEGACY',
				'FOURTH_LEGACY',
			],
		},
		'FEINT',
		'TRUE_NORTH',
		'SLITHER',
		'SECOND_WIND',
		'BLOODBATH',
	]
}
