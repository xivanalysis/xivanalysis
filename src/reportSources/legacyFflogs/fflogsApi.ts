import * as Sentry from '@sentry/browser'
import * as Errors from 'errors'
import ky, {Options, Hooks} from 'ky'
import {Fight,  ReportEventsQuery, ReportEventsResponse} from './eventTypes'
import {Report} from './legacyStore'

type CacheBehavior = 'read' | 'bypass'

const FROM_CACHE_HEADER = '__from-cache'
const HTTP_TOO_MANY_REQUESTS = 429

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

function createCacheHooks(cache: Cache | undefined, behavior: CacheBehavior): Hooks {
	if (cache == null) { return {} }

	return {
		// If bypassing the cache, disable beforeRequest to prevent reading from it
		// - we still want to cache responses.
		beforeRequest: behavior === 'bypass' ? [] : [
			async request => {
				try {
					// Before sending a request, try to fetch it from the cache.
					const cachedResponse = await cache.match(request)
					// If we got a cached response, mark it so we don't try to re-cache it later.
					cachedResponse?.headers.append(FROM_CACHE_HEADER, 'true')
					return cachedResponse
				} catch (error) {
					// Catch errors when dealing with the cache, and report them -
					// a failure here should not halt the program, it's just a cache.
					Sentry.withScope(scope => {
						scope.setExtras({request})
						Sentry.captureException(error)
					})
				}
			},
		],

		afterResponse: [
			(request, _options, response) => {
				// If the response was fetched from cache, don't need to do anything.
				if (response.headers.has(FROM_CACHE_HEADER)) {
					return
				}

				// Try to save successful responses to the cache. Failure can be ignored
				// as far as the user is concerned.
				if (response.ok) {
					try {
						cache.put(request, response)
					} catch (error) {
						Sentry.withScope(scope => {
							scope.setExtras({
								error,
								request,
							})
							Sentry.captureMessage('Failed to save response to cache.', Sentry.Severity.Warning)
						})
					}
				}
			},
		],
	}
}

export async function fetchFflogs<T>(
	url: string,
	searchParameters: Record<string, string | number | boolean>,
	cache: Cache | undefined,
	behavior: CacheBehavior
) {
	try {
		return await fflogsApi.get(url, {
			searchParams: {
				...(behavior === 'bypass' ? {bypassCache: 'true'} : {}),
				...searchParameters,
			},
			hooks: createCacheHooks(cache, behavior),
		}).json<T>()
	} catch (error) {
		if (error instanceof ky.HTTPError && error.response.status === HTTP_TOO_MANY_REQUESTS) {
			throw new Errors.TooManyRequestsError()
		}

		throw new Errors.UnknownApiError({inner: error})
	}
}

function fetchEvents(
	code: string,
	searchParams: Record<string, string | number | boolean>,
	cache: Cache | undefined,
	behavior: CacheBehavior,
) {
	return fetchFflogs<ReportEventsResponse>(`report/events/${code}`, searchParams, cache, behavior)
}

async function requestEvents(
	code: string,
	query: ReportEventsQuery,
	cache: Cache | undefined
) {
	const searchParams = query as Record<string, string | number | boolean>
	let response = await fetchEvents(
		code,
		searchParams,
		cache,
		'read'
	)

	// If it's blank, try again, bypassing the cache
	if (response === '') {
		response = await fetchEvents(
			code,
			searchParams,
			cache,
			'bypass'
		)
	}

	// If it's _still_ blank, bail and get them to retry
	if (response === '') {
		throw new Errors.ReportProcessingError()
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

	// Grab the cache storage we'll be using for requests.
	let cache: Cache | undefined
	try {
		cache = await getCache(report.code)
	} catch (error) {
		Sentry.captureException(error)
		cache = undefined
	}

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

export async function getCache(code: Report['code']): Promise<Cache | undefined> {
	// This is currently bucketing an entire report at a time. Keep an eye on behavior,
	// it's relatively easy to tweak this key to increase/decrease bucket size.
	// NOTE: Decreasing size of bucket will require splitting reports into their
	// own bucket, which will in turn require more nuanced bucket deletion logic.
	const key = code

	// Grab all the current cache names, as well as the cache we actually want
	const [keys, cache] = await Promise.all([
		window.caches.keys(),
		window.caches.open(key),
	])

	// Delete any caches that aren't the one we requested.
	for (const cacheKey of keys) {
		if (cacheKey === key) {
			continue
		}

		window.caches.delete(cacheKey)
	}

	return cache
}
