import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Interrupts as CoreInterrupts} from 'parser/core/modules/Interrupts'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class Interrupts extends CoreInterrupts {
	static override displayOrder = DISPLAY_ORDER.INTERRUPTS
	override suggestionContent = <Trans id="whm.interrupts.suggestion.content">
		Avoid interrupting casts by either prepositioning yourself or utilizing slidecasting where possible.
		Use windows created by normal <DataLink action="DIA"/> refreshes to move in advance of mechanics.
		When that's not an option, try to plan and utilize Afflatus actions to simultaneously heal wherever needed and cover movement.
		Overwriting Dia early should be your last resort for movement.
	</Trans>
}
