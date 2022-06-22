import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Interrupts as CoreInterrupts} from 'parser/core/modules/Interrupts'
import React from 'react'

export default class Interrupts extends CoreInterrupts {
	suggestionContent = <Trans id="sch.interrupts.suggestion.content">If you can, try to preposition yourself so you don't have to move during mechanics as much as possible. Utilizing slidecasting will lower the need to use <DataLink action="SCH_RUIN_II" /> to instantly relocate or interrupt your current <DataLink action="BROIL_IV" /> cast.</Trans>
}
