import {Report, Pull} from 'report'

export interface FetchOptions {
	bypassCache?: boolean
}

/**
 * Base ReportStore implementation, defining the report interface accessible to
 * most of the application. Source-specific implementation details are handled
 * exclusively by subclasses of this class and their respective component(s).
 */
export abstract class ReportStore {
	abstract readonly report?: Report

	fetchPulls(options?: FetchOptions) {}
	fetchActors(pullId: Pull['id'], options?: FetchOptions) {}
}
