import axios, {AxiosRequestConfig} from 'axios'

import {Fight, ReportEventsQuery, ReportEventsResponse} from './fflogs'

const options: AxiosRequestConfig = {
	baseURL: process.env.REACT_APP_LOGS_BASE_URL,
}

if (process.env.REACT_APP_LOGS_API_KEY) {
	options.params = {
		api_key: process.env.REACT_APP_LOGS_API_KEY,
	}
}

// Core API via axios
export const fflogsApi = axios.create(options)

async function requestEvents(code: string, options: ReportEventsQuery) {
	const response = await fflogsApi.get<ReportEventsResponse>(
		`report/events/${code}`,
		options,
	)
	return response.data
}

// Helper for pagination and suchforth
export async function getFflogsEvents(
	code: string,
	fight: Fight,
	extra: ReportEventsQuery['params'],
) {
	// Base parameters
	const params = {
		start: fight.start_time,
		end: fight.end_time,
		translate: true,
	}

	// Any extra params
	if (extra) {
		Object.assign(params, extra)
	}

	// Initial data request
	let data = await requestEvents(code, {params})
	const events = data.events

	// Handle pagination
	while (data.nextPageTimestamp) {
		params.start = data.nextPageTimestamp
		data = await requestEvents(code, {params})
		events.push(...data.events)
	}

	// And done
	return events
}
