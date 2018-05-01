import React, { Fragment } from 'react'

import { ActionLink } from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import CoreChecklist from 'parser/core/modules/Checklist'

export default class Checklist extends CoreChecklist {
	// This probably should use proper Rule components and stuff.
	rules = [{
		name: 'Keep your DoTs up',
		description: <Fragment>
			As a Summoner, DoTs are significant portion of your sustained damage, and are required for optimal damage from <ActionLink {...ACTIONS.FESTER}/>, your primary stack spender. Aim to keep them up at all times.
		</Fragment>,
		percent: 90
	}]
}
