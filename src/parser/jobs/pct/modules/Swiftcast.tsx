import {Trans} from '@lingui/macro'
import {DataLink} from 'components/ui/DbLink'
import {Swiftcast as CoreSwiftcast} from 'parser/core/modules/Swiftcast'
import React from 'react'

export class Swiftcast extends CoreSwiftcast {
	override suggestionContent = <Trans id="pct.swiftcast.missed.suggestion.content">Cast a spell with <DataLink action="SWIFTCAST" /> before it expires. This allows you to instantly cast spells with a cast times, such as a motif for a long movement or weaving window.</Trans>
}
