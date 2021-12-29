import {ReportProcessingError} from 'errors'
import ky, {Options} from 'ky'
import _ from 'lodash'
import {FflogsEvent, Fight, Pet, ReportEventsQuery, ReportEventsResponse} from './eventTypes'
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

// this is cursed shit
let eventCache: {
	key: string,
	events: FflogsEvent[],
} | undefined

// Helper for pagination and suchforth
export async function getFflogsEvents(
	report: Report,
	fight: Fight,
	extra: ReportEventsQuery,
	authoritative = false,
) {
	const {code} = report
	const cacheKey = `${code}|${fight}`

	// Base parameters
	const searchParams: ReportEventsQuery = {
		start: fight.start_time,
		end: fight.end_time,
		translate: true,
		..._.omitBy(extra, _.isNil),
	}

	// If this is a non-authoritative request, and we have an
	// authoritative copy in cache, try to filter that into shape.
	if (!authoritative && eventCache?.key === cacheKey) {
		const filter = buildEventFilter(searchParams, report)
		if (filter != null) {
			return eventCache.events.filter(filter)
		}
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

	// If this is an authoritative request, cache the data
	if (authoritative) {
		eventCache = {
			key: cacheKey,
			events,
		}
	}

	// And done
	return events
}

function buildEventFilter(
	query: ReportEventsQuery,
	report: Report,
) {
	const {start, end, actorid, filter} = query

	// TODO: Do we want to try and parse the mess of filters?
	if (filter != null) {
		return
	}

	const predicates: Array<(event: FflogsEvent) => boolean> = []

	if (start != null) {
		predicates.push((event: FflogsEvent) => event.timestamp >= start)
	}

	if (end != null) {
		predicates.push((event: FflogsEvent) => event.timestamp <= end)
	}

	if (actorid != null) {
		const petFilter = (pets: Pet[]) => pets
			.filter(pet => pet.petOwner === actorid)
			.map(pet => pet.id)

		const involvedActors = [actorid]
			.concat(petFilter(report.friendlyPets))
			.concat(petFilter(report.enemyPets))

		predicates.push((event: FflogsEvent) => false
			|| involvedActors.includes(event.sourceID ?? NaN)
			|| involvedActors.includes(event.targetID ?? NaN),
		)
	}

	return (event: FflogsEvent) => predicates.every(predicate => predicate(event))
}
