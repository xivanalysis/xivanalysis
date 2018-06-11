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
export class LogNotFoundError extends GlobalError {
	type = TYPES.WARNING
	message = 'Report not found.'
	detail = 'The report specified either does not exist, or is private. Make sure you pasted the correct URL, and your log is either public or unlisted.'
}
