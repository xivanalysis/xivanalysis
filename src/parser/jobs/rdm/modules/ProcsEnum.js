import STATUS from 'data/STATUSES'
import {SEVERITY} from 'parser/core/modules/Suggestions'

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
 * Procs that a RDM gains over a fight caused by the RDM themselves
 */
export const PROCS = [
	STATUS.VERSTONE_READY.id,
	STATUS.VERFIRE_READY.id,
]
