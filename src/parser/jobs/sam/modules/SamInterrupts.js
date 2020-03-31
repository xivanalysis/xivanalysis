import React from 'react'
import {Trans} from '@lingui/react'

import {Interrupts} from 'parser/core/modules/Interrupts'
import ACTIONS from 'data/ACTIONS'
import {ActionLink} from 'components/ui/DbLink'

export default class SamInterrupts extends Interrupts {
	suggestionContent = <Trans id="sam.interrupts.suggestion.content">
		Avoid interrupting <ActionLink {...ACTIONS.IAIJUTSU}/> casts. Despite the short cast time, moving immediately after casting can interrupt the skill, wasting any time spent doing so.
	</Trans>
}
