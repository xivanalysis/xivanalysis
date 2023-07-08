import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Interrupts as CoreInterrupts} from 'parser/core/modules/Interrupts'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class Interrupts extends CoreInterrupts {
	static override displayOrder = DISPLAY_ORDER.INTERRUPTED_CASTS
	override suggestionContent = <Trans id="blu.interrupts.suggestion.content">
		Blue Mage has few movement tools. Our <DataLink action="SWIFTCAST"/> will either be used during the <DataLink action="MOON_FLUTE" showIcon={false} /> window, or be left in reserve for a resurrect. In very select circumstances <DataLink action="COLD_FOG" showIcon={false} /> can be used to get 15 seconds of free movement, but this is rare. Generally, you will want to pre-position and use slidecast windows as much as you can.
	</Trans>
}

