import {Event} from 'event'
import {Report, Pull, Actor} from 'report'
import {isDefined} from 'utilities'
import {AVAILABLE_MODULES} from './AVAILABLE_MODULES'
import Parser, {Result} from './core/Parser'

export class Conductor {
	private parser?: Parser
	private resultsCache?: readonly Result[]

	private readonly report: Report
	private readonly pull: Pull
	private readonly actor: Actor

	constructor(opts: {
		report: Report,
		pull: Pull,
		actor: Actor,
	}) {
		this.report = opts.report
		this.pull = opts.pull
		this.actor = opts.actor
	}

	async configure() {
		// Build the final meta representation
		const rawMetas = [
			AVAILABLE_MODULES.CORE,
			AVAILABLE_MODULES.BOSSES[this.pull.encounter.key ?? 'TRASH'],
			AVAILABLE_MODULES.JOBS[this.actor.job],
		]
		const meta = rawMetas
			.filter(isDefined)
			.reduce((acc, cur) => acc.merge(cur))

		// Build the base parser instance
		const parser = new Parser({
			meta,

			report: this.report,
			pull: this.pull,
			actor: this.actor,
		})

		// Get the parser all built up and stuff
		await parser.configure()

		this.parser = parser
	}

	async parse({reportFlowEvents}: {reportFlowEvents: Event[]}) {
		if (!this.parser) {
			throw new Error('Conductor not configured.')
		}

		// Clear the cache ahead of time
		this.resultsCache = undefined

		// Parse
		// TODO: Batching?
		this.parser.parseEvents({
			events: reportFlowEvents,
		})
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
