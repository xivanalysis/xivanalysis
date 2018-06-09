import { addExtraIndex } from 'utilities'

import SHARED from './SHARED'
import ROLE from './ROLE'
import DUTY from './DUTY'
import ACN from './ACN'
import WHM from './WHM'
import SMN from './SMN'

const ACTIONS = {
	...SHARED,
	...ROLE,
	...DUTY,

	...ACN,

	...WHM,

	...SMN
}

export default addExtraIndex(ACTIONS, 'id')

// TODO: warn when falling back?
// TODO: Return object (w/ caching?) with utility functions a-la wowa's Ability?
export const getAction = id => ACTIONS[id] || {}
