import ACTIONS from 'data/ACTIONS'
import {SEVERITY} from 'parser/core/modules/Suggestions'

export const STANDARD_FINISHES = [
	ACTIONS.STANDARD_FINISH.id,
	ACTIONS.SINGLE_STANDARD_FINISH.id,
	ACTIONS.DOUBLE_STANDARD_FINISH.id,
]

export const TECHNICAL_FINISHES = [
	ACTIONS.TECHNICAL_FINISH.id,
	ACTIONS.SINGLE_TECHNICAL_FINISH.id,
	ACTIONS.DOUBLE_TECHNICAL_FINISH.id,
	ACTIONS.TRIPLE_TECHNICAL_FINISH.id,
	ACTIONS.QUADRUPLE_TECHNICAL_FINISH.id,
]

export const FINISHES = [
	...STANDARD_FINISHES,
	...TECHNICAL_FINISHES,
]

export const DEFAULT_SEVERITY_TIERS  = {
	1: SEVERITY.MINOR,
	3: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

// More lenient than usual due to the probable unreliability of the data.
export const GAUGE_SEVERITY_TIERS = {
	1: SEVERITY.MINOR,
	5: SEVERITY.MEDIUM,
	10: SEVERITY.MAJOR,
}

export interface GaugeGraphEntry {
	t: number,
	y: number,
	isGenerator: boolean,
}
