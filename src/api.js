import axios from 'axios'

const options = {
	baseURL: process.env.REACT_APP_LOGS_BASE_URL,
}

if (process.env.REACT_APP_LOGS_API_KEY) {
	options.params = {
		api_key: process.env.REACT_APP_LOGS_API_KEY,
	}
}

// Core API via axios
export const fflogsApi = axios.create(options)

// Helper for pagination and suchforth
export const getFflogsEvents = async (code, fight, extra) => {
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
	let data = (await fflogsApi.get(`report/events/${code}`, {params})).data
	const events = data.events

	// Handle pagination
	while (data.nextPageTimestamp) {
		params.start = data.nextPageTimestamp
		data = (await fflogsApi.get(`report/events/${code}`, {params})).data
		events.push(...data.events)
	}

	// And done
	return events
}
