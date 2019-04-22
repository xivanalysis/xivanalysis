import {addExtraIndex} from 'utilities'

import ENEMY from './ENEMY'
import ROLE from './ROLE'
import SHARED from './SHARED'
import ACN from './ACN'
import SCH from './SCH'
import AST from './AST'
import MNK from './MNK'
import DRG from './DRG'
import NIN from './NIN'
import BRD from './BRD'
import MCH from './MCH'
import SMN from './SMN'
import BLM from './BLM'
import RDM from './RDM'
import WAR from './WAR'
import WHM from './WHM'
import PLD from './PLD'
import SAM from './SAM'
import DRK from './DRK'

const STATUSES = addExtraIndex({
	...ENEMY,
	...ROLE,
	...SHARED,
	...ACN,

	...PLD,
	...WAR,
	...DRK,

	...SCH,
	...AST,
	...WHM,

	...MNK,
	...DRG,
	...NIN,
	...SAM,

	...BRD,
	...MCH,

	...SMN,
	...BLM,
	...RDM,
}, 'id')

export default STATUSES

// this actually should have 2 overloads: one for when `id` is `T extends keyof STATUSES`, and one for when `id` is numeric
/**
 * @param {number} id
 * @returns {STATUSES[number] | { id?: never }}
 */
export const getStatus = id => STATUSES[id] || {}
