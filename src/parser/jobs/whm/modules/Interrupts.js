import React from 'react'
import {Trans} from '@lingui/react'

import {Interrupts} from 'parser/core/modules/Interrupts'
import ACTIONS from 'data/ACTIONS'
import {ActionLink} from 'components/ui/DbLink'

export default class WhmInterrupts extends Interrupts {
	suggestionContent = <Trans id="whm.interrupts.suggestion.content">
		Avoid interrupting casts by either prepositioning yourself or utilizing slidecasting where possible.
		Use windows created by normal <ActionLink {...ACTIONS.DIA}/> refreshes to move in advance of mechanics.
		When that's not an option, try to plan and utilize Afflatus actions to simultaneously heal wherever needed and cover movement.
		Overwriting Dia early should be your last resort for movement.
	</Trans>
}
