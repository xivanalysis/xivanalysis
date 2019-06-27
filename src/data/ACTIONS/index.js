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
import DRK from './DRK'
import MCH from './MCH'
import LNC from './LNC'
import DRG from './DRG'
import GNB from './GNB'
import DNC from './DNC'

const DEFAULT_GCD_CASTTIME = 0
const DEFAULT_GCD_COOLDOWN = 2.5

const ACTIONS = addDefaultValues({
	...SHARED,
	...ROLE,
	...DUTY,
	...ITEMS,

	...ROG,
	...ARC,
	...ACN,
	...MRD,
	...PGL,
	...LNC,

	...PLD,
	...WAR,
	...DRK,
	...GNB,

	...WHM,
	...SCH,
	...AST,

	...MNK,
	...NIN,
	...SAM,
	...DRG,

	...BRD,
	...MCH,
	...DNC,

	...BLM,
	...SMN,
	...RDM,
})

// NOTE: this is not 100% sound because if something had `onGcd: false` this would also add
// castTime and cooldown to their types; but it's not possible to getting something perfect here without
// wrapping each object with, say, a `gcdAction({...})` function that would set onGcd, castTime and cooldown
// for us.
/**
 * @template T extends object
 * @param {T} obj
 * @returns {{ [K in keyof T]: T[K] & (T[K]['onGcd'] extends boolean ? { castTime: number; cooldown: number } : {})}
 */
function addDefaultValues (obj) {
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

export const HIT_TYPES = {
	CRIT: 2,
}

export default ACTIONS
