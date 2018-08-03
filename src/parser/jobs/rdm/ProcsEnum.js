import ACTIONS from 'data/ACTIONS'
import STATUS from 'data/STATUSES'
import {enumify} from 'utilities'
import {SEVERITY} from 'parser/core/modules/Suggestions'

/**
 * Procs that a RDM gains over a fight caused by the RDM themselves
 */
export const PROCS = [
	STATUS.VERSTONE_READY.id,
	STATUS.VERFIRE_READY.id,
	STATUS.IMPACTFUL.id,
	STATUS.ENHANCED_SCATTER.id,
]

/**
 * Actions that are tracked to determine if procs were wasted or not
 */
export const TRACKED_SPELLS = [
	ACTIONS.IMPACT.id,
	ACTIONS.VERSTONE.id,
	ACTIONS.VERFIRE.id,
	ACTIONS.VERTHUNDER.id,
	ACTIONS.VERAREO.id,
	//Allowing globally for now, however I need to do some extra logic in relation to Scatter
	ACTIONS.SCATTER.id,
]

/**
 * What is our current Cast state, used to compare what was cast
 * vs what buffs are up on buff removal
 */
export const CAST_STATE = {
	NA: 0,
	IMPACT: 1,
	VERSTONE: 2,
	VERFIRE: 3,
	VERTHUNDER: 4,
	VERAREO: 5,
	SCATTER: 6,
}

//For use when I refactor DualCast
export const SEVERITY_WASTED_PROCS = {
	1: SEVERITY.MINOR,
	3: SEVERITY.MEDIUM,
	7: SEVERITY.MAJOR,
}

export const SEVERITY_OVERWRITTEN_PROCS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

export const SEVERITY_INVULN_PROCS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

export const SEVERITY_MISSED_PROCS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	7: SEVERITY.MAJOR,
}

/**
 * Returns the Key name of the given Value
 */
enumify(CAST_STATE)
