import { addExtraIndex } from 'utilities'

import ROLE from './ROLE'
import ACN from './ACN'
import SMN from './SMN'

const ACTIONS = {
	...ROLE,
	...ACN,
	...SMN
}

export default addExtraIndex(ACTIONS, 'id')

// TODO: warn when falling back?
// TODO: Return object (w/ caching?) with utility functions a-la wowa's Ability?
export const getAction = id => ACTIONS[id] || {}
