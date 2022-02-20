import {Event, Events} from 'event'
import {BuffWindow, EvaluatedAction, PlayersBuffedEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {ensureArray} from 'utilities'
import {filter, oneOf, noneOf} from '../../../filter'

/**
 * Tracks buffs applied to the party.
 */
export abstract class RaidBuffWindow extends BuffWindow {

	/**
	 * Array of all status apply events on players for the buffs specified.
	 *
	 * These might ideally belong in the History, but it would break the
	 * current paradigm of the ActionWindow.
	 */
	protected raidBuffApplications = new Array<Events['statusApply']>()

	/**
	 * Expected number of people who should get the raid buff every time.
	 */
	protected expectedCount = 0

	override initialise() {
		super.initialise()

		const partyMembers = this.parser.pull.actors
			.filter(actor => actor.playerControlled)
			.map(actor => actor.id)
		this.expectedCount = partyMembers.length
		const playerOwnedIds = this.parser.pull.actors
			.filter(actor => (actor.owner === this.parser.actor) || actor === this.parser.actor)
			.map(actor => actor.id)
		const statusFilter = filter<Event>()
			.type('statusApply')
			.status(oneOf(ensureArray(this.buffStatus).map(s => s.id)))

		this.addEventHook(
			statusFilter
				.source(oneOf(playerOwnedIds))
				.target(oneOf(partyMembers)),
			this.onRaidBuffApply
		)

		// Duplicate jobs can override buffs
		this.addEventHook(
			statusFilter
				.source(noneOf(playerOwnedIds))
				.target(this.parser.actor.id),
			this.maybeReOpenPreviousWindow
		)

		this.addEvaluator(new PlayersBuffedEvaluator({
			expectedCount: this.expectedCount,
			affectedPlayers: this.affectedPlayers.bind(this),
		}))
	}

	private onRaidBuffApply(event: Events['statusApply']) {
		this.raidBuffApplications.push(event)
	}

	private affectedPlayers(buffWindow: HistoryEntry<EvaluatedAction[]>): number {
		const windowEnd = buffWindow?.end ?? buffWindow.start
		// count the number of applications that happened in the window
		const affected = this.raidBuffApplications.filter(event => {
			return (buffWindow.start <= event.timestamp &&
				event.timestamp <= windowEnd)
		})

		return affected.length
	}

	private maybeReOpenPreviousWindow(event: Events['statusApply']) {
		// If your buff was overridden, the end timestamp should match the overriding event.
		if (this.history.endOfLastEntry() === event.timestamp) {
			const last = this.history.reopenLastEntry()
			if (last != null) {
				this.startWindowAndTimeout(last.start)
			}
		}
	}
}
