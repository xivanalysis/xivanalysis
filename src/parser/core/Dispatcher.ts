import {Event} from 'event'
import {Injectable} from './Injectable'

type Handle = (typeof Injectable)['handle']

/** DOCS */
export interface DispatchIssue {
	handle: Handle,
	error: Error
}

export class Dispatcher {
	/** DOCS */
	dispatch(event: Event, handles: Handle[]): DispatchIssue[] {
		return []
	}
	}
}
