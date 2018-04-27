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
