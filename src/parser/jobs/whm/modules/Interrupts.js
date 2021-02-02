import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import CoreInterrupts from 'parser/core/modules/Interrupts'
import React from 'react'

export default class Interrupts extends CoreInterrupts {
	suggestionContent = <Trans id="whm.interrupts.suggestion.content">
		Avoid interrupting casts by either prepositioning yourself or utilizing slidecasting where possible.
		Use windows created by normal <ActionLink {...ACTIONS.DIA}/> refreshes to move in advance of mechanics.
		When that's not an option, try to plan and utilize Afflatus actions to simultaneously heal wherever needed and cover movement.
		Overwriting Dia early should be your last resort for movement.
	</Trans>
}
