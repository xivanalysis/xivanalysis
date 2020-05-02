import React from 'react'
import {Trans} from '@lingui/react'

import {Interrupts} from 'parser/core/modules/Interrupts'
import ACTIONS from 'data/ACTIONS'
import {ActionLink} from 'components/ui/DbLink'

export default class SamInterrupts extends Interrupts {
	suggestionContent = <Trans id="sam.interrupts.suggestion.content">
		Avoid interrupting <ActionLink {...ACTIONS.IAIJUTSU}/> casts. Despite the short cast time, moving too early can interrupt the skill causing you to have to waste time re-casting it.
	</Trans>
}
