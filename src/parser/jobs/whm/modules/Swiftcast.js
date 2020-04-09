import React from 'react'
import {Trans} from '@lingui/macro'

import ACTIONS from 'data/ACTIONS'
import {ActionLink} from 'components/ui/DbLink'
import {SwiftcastModule} from 'parser/core/modules/Swiftcast'

export default class Swiftcast extends SwiftcastModule {
	suggestionContent = <Trans id="whm.swiftcast.missed.suggestion.content">Cast a spell with <ActionLink {...ACTIONS.SWIFTCAST}/> before it expires. This allows you to instantly cast spells with a cast times, such as <ActionLink {...ACTIONS.RAISE}/> for a quick revive, or <ActionLink {...ACTIONS.GLARE}/> for weaving.</Trans>
}
