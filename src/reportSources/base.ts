import {Report, Pull, Actor} from 'report'
import {MessageDescriptor} from '@lingui/core'

export type SearchHandlerResult =
	| {valid: false, reason?: MessageDescriptor}
	| {valid: true, path: string}

export interface SearchHandler {
	regexp: RegExp
	handler: (match: Record<string, string>) => SearchHandlerResult
}

export interface FetchOptions {
	bypassCache?: boolean
}

export interface ReportLink {
	icon?: string
	name: string
	url: string
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

	getReportLink(
		pullId?: Pull['id'],
		actorId?: Actor['id'],
	): ReportLink | undefined { return }
}
