import {Trans} from '@lingui/macro'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {Swiftcast as CoreSwiftcast} from 'parser/core/modules/Swiftcast'
import React from 'react'

export default class Swiftcast extends CoreSwiftcast {
	suggestionContent = <Trans id="whm.swiftcast.missed.suggestion.content">Cast a spell with <ActionLink {...ACTIONS.SWIFTCAST}/> before it expires. This allows you to instantly cast spells with a cast times, such as <ActionLink {...ACTIONS.RAISE}/> for a quick revive, or <ActionLink {...ACTIONS.GLARE}/> for weaving.</Trans>
}
