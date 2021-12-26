import {Trans} from '@lingui/react'
import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'
import React from 'react'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,

		{
			label: <Trans id="mnk.action-timeline.chakras">Chakras</Trans>,
			content: 'THE_FORBIDDEN_CHAKRA',
		},
		'RIDDLE_OF_FIRE',
		'BROTHERHOOD',
		'PERFECT_BALANCE',
		'ELIXIR_FIELD',
		'TORNADO_KICK',
		'ANATMAN',
		'RIDDLE_OF_EARTH',
		'MANTRA',
		'RIDDLE_OF_WIND',
	]
}
