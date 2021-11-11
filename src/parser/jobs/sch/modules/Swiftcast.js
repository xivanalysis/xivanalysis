import {Trans} from '@lingui/macro'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {Swiftcast as CoreSwiftcast} from 'parser/core/modules/Swiftcast'
import React from 'react'

export default class Swiftcast extends CoreSwiftcast {
	suggestionContent = <Trans id="sch.swiftcast.missed.suggestion.content">Use spells with <ActionLink {...ACTIONS.SWIFTCAST}/> before it expires. This allows you to use spells with cast times instantly, such as <ActionLink {...ACTIONS.RESURRECTION}/> for a quick revive, or <ActionLink {...ACTIONS.BROIL_III}/> for weaving.</Trans>
}
