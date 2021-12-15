import {Trans} from '@lingui/macro'
import {DataLink} from 'components/ui/DbLink'
import {Swiftcast as CoreSwiftcast} from 'parser/core/modules/Swiftcast'
import React from 'react'

export default class Swiftcast extends CoreSwiftcast {
	override suggestionContent = <Trans id="sge.swiftcast.missed.suggestion.content">Cast a spell with <DataLink action="SWIFTCAST" /> before it expires. This allows you to instantly cast spells with a cast times, such as <DataLink action="EGEIRO" /> for a quick revive, or <DataLink action="DOSIS_III" /> for weaving.</Trans>
}
