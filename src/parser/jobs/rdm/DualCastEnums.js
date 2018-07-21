import ACTIONS from 'data/ACTIONS'
import {enumify} from 'utilities'

/**
 * Cast Type Methods available to RDMs
 */
export const CAST_TYPE = {
	NA: 0,
	HardCast: 1,
	SwiftCast: 2,
}

/**
 * Actions that are good for DualCast usage
 */
export const CORRECT_GCDS = [
	ACTIONS.VERAREO.id,
	ACTIONS.VERTHUNDER.id,
	ACTIONS.VERRAISE.id,
]

/**
 * Returns the Key name of the given Value
 */
enumify(CAST_TYPE)
