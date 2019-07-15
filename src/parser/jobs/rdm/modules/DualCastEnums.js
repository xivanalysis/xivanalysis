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
	ACTIONS.VERAERO.id,
	ACTIONS.VERTHUNDER.id,
	ACTIONS.VERRAISE.id,
	//Allowing globally for now, however I need to do some extra logic in relation to Scatter
	ACTIONS.SCATTER.id,
	ACTIONS.IMPACT.id,
]

/**
 * Returns the Key name of the given Value
 */
enumify(CAST_TYPE)
