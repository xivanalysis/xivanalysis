import {addExtraIndex} from 'utilities'

import SHARED from './SHARED'
import ROLE from './ROLE'
import DUTY from './DUTY'
import ITEMS from './ITEMS'
import ACN from './ACN'
import WHM from './WHM'
import SMN from './SMN'
import RDM from './RDM'
import MRD from './MRD'
import WAR from './WAR'

const ACTIONS = {
	...SHARED,
	...ROLE,
	...DUTY,
	...ITEMS,

	...ACN,
	...MRD,

	...WAR,

	...WHM,

	...SMN,
	...RDM,
}

addExtraIndex(ACTIONS, 'id')

export default ACTIONS

// TODO: warn when falling back?
// TODO: Return object (w/ caching?) with utility functions a-la wowa's Ability?
export const getAction = id => ACTIONS[id] || {}
