import ky, {Options} from 'ky'
import _ from 'lodash'

import {Fight, ReportEventsQuery, ReportEventsResponse} from './fflogs'

const options: Options = {
	prefixUrl: process.env.REACT_APP_LOGS_BASE_URL,
}

if (process.env.REACT_APP_LOGS_API_KEY) {
	options.searchParams = {
		api_key: process.env.REACT_APP_LOGS_API_KEY,
	}
}

// Core API via ky
export const fflogsApi = ky.create(options)

async function requestEvents(code: string, options: Options) {
	return await fflogsApi.get(
		`report/events/${code}`,
		options,
	).json<ReportEventsResponse>()
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
	let data = await requestEvents(code, {searchParams})
	const events = data.events

	// Handle pagination
	while (data.nextPageTimestamp) {
		searchParams.start = data.nextPageTimestamp
		data = await requestEvents(code, {searchParams})
		events.push(...data.events)
	}

	// And done
	return events
}
