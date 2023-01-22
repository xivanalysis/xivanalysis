import {ReportProcessingError} from 'errors'
import ky, {Options, Hooks} from 'ky'
import {Fight,  ReportEventsQuery, ReportEventsResponse} from './eventTypes'
import {Report} from './legacyStore'

const FROM_CACHE_HEADER = '__from-cache'

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

function createCacheHooks(cache: Cache): Hooks {
	return {
		// Before sending a request, try to fetch it from the cache.
		beforeRequest: [
			async request => {
				const cachedResponse = await cache.match(request)
				// If we got a cached response, mark it so we don't try to re-cache it later.
				cachedResponse?.headers.append(FROM_CACHE_HEADER, 'true')
				return cachedResponse
			},
		],

		afterResponse: [
			(request, _options, response) => {
				// If the respone was fetched from cache, don't need to do anything.
				if (response.headers.has(FROM_CACHE_HEADER)) {
					return
				}

				// Save successful responses to the cache
				if (response.ok) {
					cache.put(request, response)
				}
			},
		],
	}
}

function fetchEvents(
	code: string,
	searchParams: Record<string, string | number | boolean>,
	cache: Cache
) {
	return fflogsApi.get(
		`report/events/${code}`,
		{searchParams, hooks: createCacheHooks(cache)},
	).json<ReportEventsResponse>()
}

async function requestEvents(
	code: string,
	query: ReportEventsQuery,
	cache: Cache
) {
	const searchParams = query as Record<string, string | number | boolean>
	let response = await fetchEvents(
		code,
		searchParams,
		cache
	)

	// If it's blank, try again, bypassing the cache
	if (response === '') {
		response = await fetchEvents(
			code,
			{...searchParams, bypassCache: 'true'},
			cache
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

	// Grab the cache storage we'll be using for requests
	const cache = await getCache(report)

	// Base parameters
	const searchParams: ReportEventsQuery = {
		start: fight.start_time,
		end: fight.end_time,
		translate: true,
	}

	// Initial data request
	let data = await requestEvents(code, searchParams, cache)
	const events = data.events

	// Handle pagination
	while (data.nextPageTimestamp && data.events.length > 0) {
		searchParams.start = data.nextPageTimestamp
		data = await requestEvents(code, searchParams, cache)
		events.push(...data.events)
	}

	// And done
	return events
}

async function getCache(report: Report) {
	// This is currently bucketing an entire report at a time. Keep an eye on behavior,
	// it's relatively easy to tweak this key to increase/decrease bucket size.
	const key = report.code

	// Grab all the current cache names, as well as the cache we actually want
	const [keys, cache] = await Promise.all([
		caches.keys(),
		caches.open(key),
	])

	// Delete any caches that aren't the one we requested.
	for (const cacheKey of keys) {
		if (cacheKey === key) {
			continue
		}

		caches.delete(cacheKey)
	}

	return cache
}
