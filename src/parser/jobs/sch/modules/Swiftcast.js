import React from 'react'
import {Trans} from '@lingui/macro'

import ACTIONS from 'data/ACTIONS'
import {ActionLink} from 'components/ui/DbLink'
import {SwiftcastModule} from 'parser/core/modules/Swiftcast'

export default class Swiftcast extends SwiftcastModule {
	suggestionContent = <Trans id="sch.swiftcast.missed.suggestion.content">Use spells with <ActionLink {...ACTIONS.SWIFTCAST}/> before it expires. This allows you to use spells with cast times instantly, such as <ActionLink {...ACTIONS.RESURRECTION}/> for a quick revive, or <ActionLink {...ACTIONS.BROIL_III}/> for weaving.</Trans>
}
