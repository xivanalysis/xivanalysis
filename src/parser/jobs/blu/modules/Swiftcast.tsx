import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Swiftcast as CoreSwiftcast} from 'parser/core/modules/Swiftcast'
import React from 'react'

export class Swiftcast extends CoreSwiftcast {
	override suggestionContent = <Trans id="blu.swiftcast.suggestion.content">Cast a spell with <DataLink action="SWIFTCAST" /> before it expires.</Trans>
}
