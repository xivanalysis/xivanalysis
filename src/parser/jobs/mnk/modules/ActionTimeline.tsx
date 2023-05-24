import {Trans} from '@lingui/react'
import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'
import React from 'react'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,

		{
			label: <Trans id="mnk.action-timeline.chakras">Chakras</Trans>,
			content: ['STEEL_PEAK', 'HOWLING_FIST', 'THE_FORBIDDEN_CHAKRA', 'ENLIGHTENMENT'],
		},
		'RIDDLE_OF_FIRE',
		'BROTHERHOOD',
		'PERFECT_BALANCE',
		'RIDDLE_OF_WIND',
		'RIDDLE_OF_EARTH',
		'MANTRA',
		'THUNDERCLAP',
		'ANATMAN',
	]
}
