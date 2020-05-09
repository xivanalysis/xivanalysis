import Module, {dependency} from 'parser/core/Module'
import {Event} from 'events'
import {getFflogsEvents} from 'api'
import {sortEvents} from '../EventSorting'

// Unexported symbols so I can have properties that are inaccessible outside this file
const queries = Symbol('queries')
const hasExecuted = Symbol('hasExecuted')

export class AdditionalEventQueries extends Module {
	static handle = 'additionalEventQueries'

	private [queries]: string[] = []
	private [hasExecuted] = false

	registerQuery(query: string) {
		if (this[hasExecuted]) {
			throw new Error(`Attempted to add query after additional event query execution: ${query}`)
		}

		this[queries].push(query)
	}
}

export class AdditionalEvents extends Module {
	static handle = 'additionalEvents'
	static debug = true

	@dependency private queryModule!: AdditionalEventQueries

	async normalise(events: Event[]): Promise<Event[]> {
		this.queryModule[hasExecuted] = true

		const registeredQueries = this.queryModule[queries]

		// If there's no queries, we can noop
		if (registeredQueries.length === 0) {
			return events
		}

		// Exclude events by the current player and their pets, as we already have them from the main event lookup
		const playerIds = [
			this.parser.player.guid,
			...this.parser.player.pets.map(pet => pet.guid),
		]
		const playerFilter = `source.id not in (${playerIds.join(',')}) and target.id not in (${playerIds.join(',')})`

		// Request the new events
		const filter = `((${registeredQueries.join(') or (')})) and ${playerFilter}`
		const newEvents = await getFflogsEvents(
			this.parser.report.code,
			this.parser.fight,
			{filter},
		)

		// Add & sort the events into the existing set
		return sortEvents(events.concat(newEvents))
	}
}
