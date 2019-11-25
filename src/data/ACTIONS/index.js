import _ from 'lodash'

import SHARED from './root/SHARED'
import ROLE from './root/ROLE'
import DUTY from './root/DUTY'
import ITEMS, {ITEM_ID_OFFSET} from './root/ITEMS'
import ACN from './root/ACN'
import WHM from './root/WHM'
import SCH from './root/SCH'
import AST from './root/AST'
import ROG from './root/ROG'
import NIN from './root/NIN'
import PGL from './root/PGL'
import MNK from './root/MNK'
import SMN from './root/SMN'
import BLM from './root/BLM'
import RDM from './root/RDM'
import MRD from './root/MRD'
import WAR from './root/WAR'
import PLD from './root/PLD'
import ARC from './root/ARC'
import BRD from './root/BRD'
import SAM from './root/SAM'
import DRK from './root/DRK'
import MCH from './root/MCH'
import LNC from './root/LNC'
import DRG from './root/DRG'
import GNB from './root/GNB'
import DNC from './root/DNC'

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

export {ITEM_ID_OFFSET}

export default ACTIONS
