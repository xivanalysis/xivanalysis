import {getDataBy} from 'data'
import _ from 'lodash'
import {addExtraIndex} from 'utilities'
import ACN from './ACN'
import ARC from './ARC'
import AST from './AST'
import BLM from './BLM'
import BRD from './BRD'
import DRG from './DRG'
import DRK from './DRK'
import DUTY from './DUTY'
import ITEMS from './ITEMS'
import LNC from './LNC'
import MCH from './MCH'
import MNK from './MNK'
import MRD from './MRD'
import NIN from './NIN'
import PGL from './PGL'
import PLD from './PLD'
import RDM from './RDM'
import ROG from './ROG'
import ROLE from './ROLE'
import SAM from './SAM'
import SCH from './SCH'
import SHARED from './SHARED'
import SMN from './SMN'
import WAR from './WAR'
import WHM from './WHM'

/** Metadata for multi-action combos */
export interface Combo {
	/** Action that precedes this action in the combo chain */
	from?: Action['id']
	/** If this action is the first hit in a combo */
	start?: boolean
	/** If this action is the last hit in a combo */
	end?: boolean

	[field: string]: unknown
}

/** Data representing in-game actions */
export interface Action {
	/** Game ID */
	id: number

	/** Human readable name */
	name: string

	/** URL to icon - generally, should be xivapi */
	icon: string

	/*
	Everything below this should probably be moved out at some point -
	It's all analysis-specific metadata, and should be in the appropriate
	job bundle. But that's a job for another day when I'm not rewriting the
	entirety of core.
	*/

	onGcd?: boolean
	castTime?: number
	cooldown?: number

	pet?: number

	combo?: Combo
	breaksCombo?: boolean

	autoAttack?: boolean

	// Not included explicitly above:
	// potency - either a number of an array of numbers depending on how yumi was feeling at the time
	// mpCost/mpCostFactor - looks like it's stuff specific to one module? they can use the unknown
	[field: string]: unknown
}

const DEFAULT_GCD_CASTTIME = 0
const DEFAULT_GCD_COOLDOWN = 2500

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
	...LNC,

	...PLD,
	...WAR,
	...DRK,

	...WHM,
	...SCH,
	...AST,

	...MNK,
	...NIN,
	...SAM,
	...DRG,

	...BRD,
	...MCH,

	...BLM,
	...SMN,
	...RDM,
}

// NOTE: this is not 100% sound because if something had `onGcd: false` this would also add
// castTime and cooldown to their types; but it's not possible to getting something perfect here without
// wrapping each object with, say, a `gcdAction({...})` function that would set onGcd, castTime and cooldown
// for us.
// TODO: delete this
function addDefaultValues<T extends Record<string, Action>>(obj: T) {
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

export default addExtraIndex(
	addDefaultValues(ACTIONS as Record<keyof typeof ACTIONS, Action>),
	'id',
)

// TODO: warn when falling back?
// TODO: Return object (w/ caching?) with utility functions a-la wowa's Ability?
// this actually should have 2 overloads: one for when `id` is `T extends keyof STATUSES`, and one for when `id` is numeric
// this, and getStatuses, should just be allowed to return undefined for additional safety.
// TODO: remove the '|| {}' once call sites are type-checked, or at least audited
/**
 * Use `getDataBy` instead thank
 * @deprecated
 */
export const getAction = (id: number): Action => getDataBy(ACTIONS, 'id', id) || ({} as any)
