import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Swiftcast as CoreSwiftcast} from 'parser/core/modules/Swiftcast'
import React from 'react'

export class Swiftcast extends CoreSwiftcast {
	override suggestionContent = <Trans id="ast.swiftcast.suggestion.content"> Cast a spell with <DataLink action="SWIFTCAST" /> before it expires. This allows you to instantly cast spells with a cast times, such as <DataLink action="ASCEND"/> for a quick revive, or <DataLink action="FALL_MALEFIC"/> for weaving. </Trans>
}
