import {addExtraIndex} from 'utilities'
import _ from 'lodash'

import SHARED from './SHARED'
import ROLE from './ROLE'
import DUTY from './DUTY'
import ITEMS from './ITEMS'
import ACN from './ACN'
import WHM from './WHM'
import SCH from './SCH'
import AST from './AST'
import ROG from './ROG'
import NIN from './NIN'
import PGL from './PGL'
import MNK from './MNK'
import SMN from './SMN'
import BLM from './BLM'
import RDM from './RDM'
import MRD from './MRD'
import WAR from './WAR'
import PLD from './PLD'
import ARC from './ARC'
import BRD from './BRD'
import SAM from './SAM'

const DEFAULT_GCD_CASTTIME = 0
const DEFAULT_GCD_COOLDOWN = 2.5

const ACTIONS = {
	...SHARED,
	...ROLE,
	...DUTY,
	...ITEMS,

	...ROG,
	...ARC,
	...ACN,
	...MRD,
	...PGL,

	...PLD,
	...WAR,

	...WHM,
	...SCH,
	...AST,

	...MNK,
	...NIN,
	...SAM,

	...BRD,

	...BLM,
	...SMN,
	...RDM,
}

const addDefaultValues = obj => {
	Object.keys(obj).forEach(key => {
		const action = obj[key]
		if (action.onGcd) {
			action.castTime = action.castTime || DEFAULT_GCD_CASTTIME
			action.cooldown = action.cooldown || DEFAULT_GCD_COOLDOWN
		}
	})
	return obj
}

export const COOLDOWN_GROUPS = _.groupBy(ACTIONS, 'cooldownGroup')

addExtraIndex(ACTIONS, 'id')
addExtraIndex(addDefaultValues(ACTIONS), 'id')

export default ACTIONS

// TODO: warn when falling back?
// TODO: Return object (w/ caching?) with utility functions a-la wowa's Ability?
export const getAction = id => ACTIONS[id] || {}
