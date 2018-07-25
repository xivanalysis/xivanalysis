import {addExtraIndex} from 'utilities'

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
import SMN from './SMN'
import BLM from './BLM'
import RDM from './RDM'
import MRD from './MRD'
import WAR from './WAR'
import PLD from './PLD'
import SAM from './SAM'
import ARC from './ARC'
import BRD from './BRD'

const ACTIONS = {
	...SHARED,
	...ROLE,
	...DUTY,
	...ITEMS,

	...ROG,
	...ARC,
	...ACN,
	...MRD,

	...PLD,
	...WAR,

	...WHM,
	...SCH,
	...AST,


	...NIN,
	...SAM,

	...BRD,

	...BRD,

	...BLM,
	...SMN,
	...RDM,
}

addExtraIndex(ACTIONS, 'id')

export default ACTIONS

// TODO: warn when falling back?
// TODO: Return object (w/ caching?) with utility functions a-la wowa's Ability?
export const getAction = id => ACTIONS[id] || {}
