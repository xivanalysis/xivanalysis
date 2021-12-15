import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Interrupts as CoreInterrupts} from 'parser/core/modules/Interrupts'
import React from 'react'

export default class Interrupts extends CoreInterrupts {
	override suggestionContent = <Trans id="sge.interrupts.suggestion.content">
		Avoid interrupting casts by either prepositioning yourself or utilizing slidecasting where possible.
		Use windows created by normal <DataLink action="EUKRASIAN_DOSIS_III" /> refreshes to move in advance of mechanics.
		When that's not an option, try to plan and utilize <DataLink action="TOXIKON_II" /> or <DataLink action="EUKRASIA" /> heals to keep your GCD rolling and cover movement.
		Overwriting <DataLink showIcon={false} action="EUKRASIAN_DOSIS_III" /> early should be your last resort for movement.
	</Trans>
}
