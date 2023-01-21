import {ReportProcessingError} from 'errors'
import ky, {Options} from 'ky'
import {Fight,  ReportEventsQuery, ReportEventsResponse} from './eventTypes'
import {Report} from './legacyStore'

const options: Options = {
	prefixUrl: process.env.REACT_APP_FFLOGS_V1_BASE_URL,
	// We're dealing with some potentially slow endpoints - avoid throwing obtuse errors if it takes a bit
	timeout: false,
}

if (process.env.REACT_APP_FFLOGS_V1_API_KEY) {
	options.searchParams = {
		api_key: process.env.REACT_APP_FFLOGS_V1_API_KEY,
	}
}

// Core API via ky
export const fflogsApi = ky.create(options)

function fetchEvents(code: string, searchParams: Record<string, string | number | boolean>) {
	return fflogsApi.get(
		`report/events/${code}`,
		{searchParams},
	).json<ReportEventsResponse>()
}

async function requestEvents(
	code: string,
	query: ReportEventsQuery,
) {
	const searchParams = query as Record<string, string | number | boolean>
	let response = await fetchEvents(
		code,
		searchParams,
	)

	// If it's blank, try again, bypassing the cache
	if (response === '') {
		response = await fetchEvents(
			code,
			{...searchParams, bypassCache: 'true'},
		)
	}

	// If it's _still_ blank, bail and get them to retry
	if (response === '') {
		throw new ReportProcessingError()
	}

	// If it's a string at this point, there's an upstream failure.
	if (typeof response === 'string') {
		throw new Error(response)
	}

	return response
}

// Helper for pagination and suchforth
export async function getFflogsEvents(
	report: Report,
	fight: Fight,
) {
	const {code} = report

	// Base parameters
	const searchParams: ReportEventsQuery = {
		start: fight.start_time,
		end: fight.end_time,
		translate: true,
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
