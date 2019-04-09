import {getFflogsEvents} from 'api'
import * as Errors from 'errors'
import {Actor, Fight} from 'fflogs'
import {Report} from 'store/report'
import AVAILABLE_MODULES from './AVAILABLE_MODULES'
import {Meta} from './core'
import Module from './core/Module'
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
		// Build the base parser instance
		const parser = new Parser(
			this.report,
			this.fight,
			this.combatant,
		)

		// The any cast is required due to some job modules remaining in JS.
		const metas = [
			AVAILABLE_MODULES.CORE,
			AVAILABLE_MODULES.BOSSES[this.fight.boss],
			AVAILABLE_MODULES.JOBS[this.combatant.type],
		] as any as ReadonlyArray<Meta|undefined>

		const normalisedMetas: Meta[] = metas.map(meta => {
			if (meta) { return meta }
			return {
				modules: () => Promise.resolve({default: []}),
			}
		})

		// Load all the module data
		// If this throws, then there was probably a deploy between page load and this call. Tell them to refresh.
		let modules: ReadonlyArray<{default: ReadonlyArray<typeof Module>}>
		try {
			modules = await Promise.all(normalisedMetas.map(meta => meta.modules()))
		} catch (error) {
			if (process.env.NODE_ENV === 'development') {
				throw error
			}
			throw new Errors.ModulesNotFoundError()
		}

		// Add all the meta + modules to the parser
		modules.forEach(({default: loadedModules = []}, index) => {
			parser.addMeta({
				...normalisedMetas[index],
				loadedModules,
			})
		})

		// Get the parser all built up and stuff
		parser.buildModules()

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
