import {Trans} from '@lingui/react'
import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'
import React from 'react'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,
		{
			// This row displays the cooldown group of the non-kassatsu, non-TCJ, mudra cooldown
			content: 'TEN',
			label: <Trans id="nin.action-timeline.mudra">Mudra</Trans>,
		},
		'KASSATSU',
		'TEN_CHI_JIN',
		'TRICK_ATTACK',
		'DREAM_WITHIN_A_DREAM',
		'BUNSHIN',
		'BHAVACAKRA',
		'MUG',
		'MEISUI',
		'HELLFROG_MEDIUM',
		'SHUKUCHI',
		'SHADE_SHIFT',
	]
}
