import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Interrupts as CoreInterrupts} from 'parser/core/modules/Interrupts'
import React from 'react'
import {DisplayOrder} from './DisplayOrder'

export class Interrupts extends CoreInterrupts {
	static override displayOrder = DisplayOrder.InterruptedCasts
	override suggestionContent = <Trans id="rdm.interrupts.suggestion.content">
		Avoid interrupting casts by either prepositioning yourself or utilizing slidecasting where possible. If you need to move, try to save a use of <ActionLink {...this.data.actions.SWIFTCAST}/> or pool mana for a melee combo or <ActionLink {...this.data.actions.ENCHANTED_REPRISE}/>.
	</Trans>
}
