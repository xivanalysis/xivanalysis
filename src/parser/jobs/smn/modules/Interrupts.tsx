import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import CoreInterrupts from 'parser/core/modules/Interrupts'
import React from 'react'

export default class Interrupts extends CoreInterrupts {
	suggestionContent = <Trans id="smn.interrupts.suggestion.content">
		Avoid interrupting spells with a cast time such as <ActionLink {...this.data.actions.RUIN_III}/> by either prepositioning yourself or utilizing slidecasting where possible. If you need to move, try to save a use of <ActionLink {...this.data.actions.SWIFTCAST}/> or instant casts like <ActionLink {...this.data.actions.RUIN_IV}/>.
	</Trans>
}
