import {Trans} from '@lingui/macro'
import {DataLink} from 'components/ui/DbLink'
import {Swiftcast as CoreSwiftcast} from 'parser/core/modules/Swiftcast'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export class Swiftcast extends CoreSwiftcast {
	static override displayOrder = DISPLAY_ORDER.SWIFTCAST

	override suggestionContent = <Trans id="pct.swiftcast.missed.suggestion.content">Cast a spell with <DataLink action="SWIFTCAST" /> before it expires. This allows you to cast spells that have cast times instantly, such as using <DataLink showIcon={false} status="SWIFTCAST" />a motif for a long movement or weaving window, or <DataLink action="RAINBOW_DRIP" /> right before a boss dies or becomes untargetable.</Trans>
}
