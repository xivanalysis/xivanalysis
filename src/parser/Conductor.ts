import {getFflogsEvents} from 'api'
import * as Errors from 'errors'
import {Actor as FflogsActor, Fight} from 'fflogs'
import {Report as LegacyReport} from 'store/report'
import {isDefined} from 'utilities'
import AVAILABLE_MODULES from './AVAILABLE_MODULES'
import Parser, {Result} from './core/Parser'
import {Report, Pull, Actor} from 'report'

export class Conductor {
	private parser?: Parser
	private resultsCache?: ReadonlyArray<Result>

	private readonly legacyReport: LegacyReport
	private readonly fight: Fight
	private readonly combatant: FflogsActor

	private readonly report: Report
	private readonly pull: Pull
	private readonly actor: Actor

	constructor(opts: {
		legacyReport: LegacyReport,
		report: Report,
		pullId: string,
		actorId: string,
	}) {
		this.legacyReport = opts.legacyReport
		this.report = opts.report

		// TODO: Remove fight/combatant logic here.
		// TODO: Move pull/actor logic up to final analyse component?
		const fight = this.legacyReport.fights
			.find(fight => fight.id === parseInt(opts.pullId, 10))
		const pull = this.report.pulls.find(pull => pull.id === opts.pullId)
		if (fight == null || pull == null) {
			throw new Errors.NotFoundError({type: 'pull'})
		}
		this.fight = fight
		this.pull = pull

		const combatant = this.legacyReport.friendlies
			.find(friend => friend.id === parseInt(opts.actorId, 10))
		const actor = pull.actors.find(actor => actor.id === opts.actorId)
		if (combatant == null || actor == null) {
			throw new Errors.NotFoundError({type: 'friendly combatant'})
		}
		this.combatant = combatant
		this.actor = actor
	}

	async configure() {
		// Build the final meta representation
		const rawMetas = [
			AVAILABLE_MODULES.CORE,
			AVAILABLE_MODULES.BOSSES[this.fight.boss],
			AVAILABLE_MODULES.JOBS[this.actor.job],
		]
		const meta = rawMetas
			.filter(isDefined)
			.reduce((acc, cur) => acc.merge(cur))

		// Build the base parser instance
		const parser = new Parser({
			meta,
			report: this.legacyReport,
			fight: this.fight,
			fflogsActor: this.combatant,

			newReport: this.report,
			pull: this.pull,
			actor: this.actor,
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
			this.legacyReport.code,
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
