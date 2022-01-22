import {Trans} from '@lingui/macro'
import {DataLink} from 'components/ui/DbLink'
import {Swiftcast as CoreSwiftcast} from 'parser/core/modules/Swiftcast'
import React from 'react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class Swiftcast extends CoreSwiftcast {
	static override displayOrder = DISPLAY_ORDER.SWIFTCAST
	override suggestionContent = <Trans id="whm.swiftcast.missed.suggestion.content">Cast a spell with <DataLink action="SWIFTCAST"/> before it expires. This allows you to instantly cast spells with a cast times, such as <DataLink action="RAISE"/> for a quick revive, or <DataLink action="GLARE_III"/> for weaving.</Trans>
}
