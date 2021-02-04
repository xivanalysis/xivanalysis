import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {Interrupts as CoreInterrupts} from 'parser/core/modules/Interrupts'
import React from 'react'

export default class Interrupts extends CoreInterrupts {
	suggestionContent = <Trans id="sch.interrupts.suggestion.content">If you can, try to preposition yourself so you don't have to move during mechanics as much as possible. Utilizing slidecasting will lower the need to use <ActionLink {...ACTIONS.SCH_RUIN_II}/> to instantly relocate or interrupt your current Broil III cast</Trans>
}
