import {getFflogsEvents} from 'api'
import * as Errors from 'errors'
import {Actor, Fight} from 'fflogs'
import {Report} from 'store/report'
import {isDefined} from 'utilities'
import AVAILABLE_MODULES from './AVAILABLE_MODULES'
import {Meta} from './core/Meta'
import Parser, {Result} from './core/Parser'

export class Conductor {
	private parser?: Parser
	private resultsCache?: ReadonlyArray<Result>

	constructor(
		private readonly report: Report,
		private readonly fight: Fight,
		private readonly combatant: Actor,
	) {}

	sanityCheck() {
		// Fight exists
		if (!this.fight) {
			throw new Errors.NotFoundError({type: 'fight'})
		}

		// Combatant exists
		if (!this.combatant) {
			throw new Errors.NotFoundError({type: 'friendly combatant'})
		}

		// Combatant took part in fight
		if (!this.combatant.fights.find(fight => fight.id === this.fight.id)) {
			throw new Errors.DidNotParticipateError({
				combatant: this.combatant.name,
				fight: this.fight.id,
			})
		}
	}

	async configure() {
		// Build the final meta representation
		const rawMetas = [
			AVAILABLE_MODULES.CORE,
			AVAILABLE_MODULES.BOSSES[this.fight.boss],
			AVAILABLE_MODULES.JOBS[this.combatant.type],
		]
		const meta = rawMetas
			.filter(isDefined)
			.reduce((acc, cur) => acc.merge(cur))

		// Build the base parser instance
		const parser = new Parser({
			meta,
			report: this.report,
			fight: this.fight,
			actor: this.combatant,
		})

		// Get the parser all built up and stuff
		await parser.configure()

		this.parser = parser
	}

	async parse() {
		if (!this.parser) {
			throw new Error('Conductor not configured.')
		}

		// Clear the cache ahead of time
		this.resultsCache = undefined

		// Fetch events
		const events = await getFflogsEvents(
			this.report.code,
			this.fight,
			{actorid: this.combatant.id},
		)

		// Normalise & parse
		// TODO: Batching?
		const normalisedEvents = await this.parser.normalise(events)
		this.parser.parseEvents(normalisedEvents)
	}

	getResults() {
		if (!this.parser) {
			throw new Error('Conductor not configured.')
		}

		if (!this.resultsCache) {
			this.resultsCache = this.parser.generateResults()
		}

		return this.resultsCache
	}
}
