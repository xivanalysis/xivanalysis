import { addExtraIndex } from 'utilities'

import ROLE from './ROLE'
import ACN from './ACN'
import WHM from './WHM'
import SMN from './SMN'

const ACTIONS = {
	...ROLE,
	...ACN,

	...WHM,

	...SMN
}

export default addExtraIndex(ACTIONS, 'id')

// TODO: warn when falling back?
// TODO: Return object (w/ caching?) with utility functions a-la wowa's Ability?
export const getAction = id => ACTIONS[id] || {}
