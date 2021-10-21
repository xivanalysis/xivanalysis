import {Status, StatusKey} from 'data/STATUSES'
import {Events} from 'event'
import {ensureArray} from 'utilities'
import {Analyser} from '../Analyser'
import {dependency} from '../Injectable'
import {Actor, StatusEvent} from './Actors'
import {Data} from './Data'
import {Invulnerability} from './Invulnerability'

interface Edge {
	side: 'apply' | 'remove'
	timestamp: number
}

export class Statuses extends Analyser {
	static override handle = 'statuses'
	static override debug = false

	@dependency private readonly data!: Data
	@dependency private readonly invulnerability!: Invulnerability

	/**
	 * Calculate the total uptime of the specified status across allspecified actors.
	 * @param statusSpecifier Status to calculate uptime of.
	 * @param targetSpecifier Target(s) that should be checked for the status.
	 * @param source Source of statuses to filter by. Defaults to the parsed actor.
	 */
	getUptime(
		statusSpecifier: StatusKey | Status,
		targetSpecifier: Actor | Actor[],
		source = this.parser.actor
	) {
		// Resolve arguments.
		const status = typeof statusSpecifier === 'string'
			? this.data.statuses[statusSpecifier]
			: statusSpecifier

		const targets = ensureArray(targetSpecifier)

		// Collect all the status history for the specified status/target/source combo.
		const edges = targets.flatMap(target => this.edgesForActor(
			target,
			target.statusHistory.get(status.id)?.get(source.id) ?? []
		))

		// Edges are mapped from multiple potential targets; interlace by sorting by timestamp.
		edges.sort((a, b) => a.timestamp - b.timestamp)

		// Sum time when any of the specified targets had the status.
		const meta = {uptime: 0, depth: 0, application: 0}
		for (const edge of edges) {
			if (edge.side === 'apply') {
				if (meta.depth === 0) {
					meta.application = edge.timestamp
				}
				meta.depth ++

			} else {
				meta.depth --
				if (meta.depth === 0) {
					meta.uptime += edge.timestamp - meta.application
				}
			}

			this.debug(`Status ${status.name} ${edge.side} at ${this.ft(edge.timestamp)}, depth=${meta.depth}`)
		}

		return meta.uptime
	}

	private edgesForActor(target: Actor, events: StatusEvent[]) {
		// We can safely assume status events from an actor will alternate between apply and remove.
		const edges: Edge[] = []
		let apply: Events['statusApply'] | undefined
		let refresh: Events['statusApply'] | undefined

		for (const event of events) {
			// Track the initial application and refreshes.
			if (event.type === 'statusApply') {
				apply ??= event
				refresh = event
				continue
			}

			if (apply == null) {
				continue
			}

			// Window has been closed, merge any edges in.
			edges.push(...this.splitRangeForInvulns(
				target,
				apply.timestamp,
				event.timestamp
			))
			apply = undefined
		}

		// If we've got a dangling apply, build edges for it.
		if (apply != null) {
			// Try to find a reasonable remove time for the status, if it has a duration.  Cap to the end of the fight.
			const statusDuration = this.data.getStatus(apply.status)?.duration
			const remove = statusDuration == null
				? this.parser.currentEpochTimestamp
				: Math.min((refresh ?? apply).timestamp + statusDuration, this.parser.pull.timestamp + this.parser.pull.duration)

			edges.push(...this.splitRangeForInvulns(
				target,
				apply.timestamp,
				remove,
			))
		}

		return edges
	}

	private splitRangeForInvulns(target: Actor, apply: number, remove: number): Edge[] {
		let range = {apply, remove}
		const finalRanges = [range]

		// Get the invuln windows that occured during this range
		const invulns = this.invulnerability.getWindows({
			start: apply,
			end: remove,
			actorFilter: actor => actor.kind === target.kind,
			types: ['invulnerable'],
		})

		for (const invuln of invulns) {
			// Invuln clipped start of range.
			if (invuln.start < range.apply && invuln.end >= range.apply) {
				this.debug(`Start clip, [${this.ft(range.apply)},${this.ft(range.remove)}] -> [${this.ft(invuln.end)},${this.ft(range.remove)}]`)

				range.apply = invuln.end
				continue
			}

			// Invuln clipped end of range.
			if (invuln.start <= range.remove && invuln.end > range.remove) {
				this.debug(`End clip, [${this.ft(range.apply)},${this.ft(range.remove)}] -> [${this.ft(range.apply)},${this.ft(invuln.start)}]`)

				range.remove = invuln.start
				continue
			}

			// Everything else should be a range split, sanity check.
			if (invuln.start < range.apply || invuln.end > range.remove) {
				continue
			}

			this.debug(`Split [${this.ft(range.apply)},${this.ft(range.remove)}] -> [${this.ft(range.apply)},${this.ft(invuln.start)}], [${this.ft(invuln.end)},${this.ft(range.remove)}]`)

			// Split the range into two around the invuln.
			const previousRange = range
			range = {...range}
			finalRanges.push(range)

			previousRange.remove = invuln.start
			range.apply = invuln.end
		}

		// Map the ranges into edges.
		return finalRanges.flatMap(range => [
			{side: 'apply', timestamp: range.apply},
			{side: 'remove', timestamp: range.remove},
		] as const)
	}

	// Small utility for formatting timestamps, as we do it a _lot_ in debug messages
	private ft = (timestamp: number) => this.parser.formatEpochTimestamp(timestamp, 1)
}
