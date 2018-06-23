import ExtendableError from 'es6-error'

export const TYPES = {
	ERROR: 'error',
	WARNING: 'warning'
}

// Global Errors
export class GlobalError extends ExtendableError {
	type = TYPES.ERROR
}

// TODO: Should I care about not being able to override the message?
export class ReportNotFoundError extends GlobalError {
	type = TYPES.WARNING
	message = 'Report not found.'
	detail = 'The report specified either does not exist, or is private. Make sure you pasted the correct URL, and your log is either public or unlisted.'
}

// TODO: Bit of repetition. Should these be combined, or...?
export class FightNotFoundError extends GlobalError {
	type = TYPES.WARNING
	message = 'Fight not found.'
	detail = 'No fight was found with the specificied ID.'
}

export class CombatantNotFoundError extends GlobalError {
	type = TYPES.WARNING
	message = 'Combatant not found.'
	detail = 'No friendly combatant was found with the specificied ID.'
}

export class UnknownApiError extends GlobalError {
	detail = 'An error occured while requesting data from FFLogs. If this issue persists, let us know on Discord.'
}
