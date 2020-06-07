import {ReportProcessingError} from 'errors'
import ky, {Options} from 'ky'
import _ from 'lodash'
import {Fight, ReportEventsQuery, ReportEventsResponse} from './fflogs'

const options: Options = {
	prefixUrl: process.env.REACT_APP_LOGS_BASE_URL,
	// We're dealing with some potentially slow endpoints - avoid throwing obtuse errors if it takes a bit
	timeout: false,
}

if (process.env.REACT_APP_LOGS_API_KEY) {
	options.searchParams = {
		api_key: process.env.REACT_APP_LOGS_API_KEY,
	}
}

// Core API via ky
export const fflogsApi = ky.create(options)

async function requestEvents(code: string, searchParams: Record<string, string|number>) {
	let response = await fflogsApi.get(
		`report/events/${code}`,
		{searchParams},
	).json<ReportEventsResponse>()

	// If it's blank, try again, bypassing the cache
	if (response === '') {
		response = await fflogsApi.get(
			`report/events/${code}`,
			{searchParams: {...searchParams, bypassCache: 'true'}},
		).json<ReportEventsResponse>()
	}

	// If it's _still_ blank, bail and get them to retry
	if (response === '') {
		throw new ReportProcessingError()
	}

	return response
}

// Helper for pagination and suchforth
export async function getFflogsEvents(
	code: string,
	fight: Fight,
	extra: ReportEventsQuery,
) {
	// Base parameters
	const searchParams = {
		start: fight.start_time,
		end: fight.end_time,
		translate: 'true',
		..._.omitBy(extra, _.isNil),
	}

	// Initial data request
	let data = await requestEvents(code, searchParams)
	const events = data.events

	// Handle pagination
	while (data.nextPageTimestamp && data.events.length > 0) {
		searchParams.start = data.nextPageTimestamp
		data = await requestEvents(code, searchParams)
		events.push(...data.events)
	}

	// And done
	return events
}
