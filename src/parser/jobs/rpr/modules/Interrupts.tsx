import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Interrupts as CoreInterrupts} from 'parser/core/modules/Interrupts'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class Interrupts extends CoreInterrupts {
	static override displayOrder = DISPLAY_ORDER.INTERRUPTS

	override suggestionContent = <Trans id="rpr.interrupts.suggestion.content">
		Avoid interrupting casts by either pre-positioning yourself or slidecasting where possible.
		If you need to move, consider using <ActionLink action="HELLS_INGRESS"/> or <ActionLink action="HELLS_EGRESS"/> and getting a free <ActionLink action="HARPE"/> out of it.
	</Trans>
}
