import {Event, Events} from 'event'
import {BuffWindow, EvaluatedAction, PlayersBuffedEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {ensureArray} from 'utilities'
import {filter, oneOf, noneOf} from '../../../filter'
import {RaidBuffOverwriteEvaluator} from '../evaluators/RaidBuffOverwriteEvaluator'

const FULL_PARTY_SIZE = 8

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

	// Implementing jobs may choose to disable the multiple-players-of-same-job overwrite evaluation
	// if there is good reason to do so
	protected evaluateOverwrites = true

	/**
	 * Expected number of people who should get the raid buff every time.
	 */
	protected expectedCount = 0

	// RaidBuffWindows track applications to all members of the parsing actor's party
	override partyBuffTargetList = this.parser.pull.actors
		.filter(actor => actor.playerControlled)
		.map(actor => actor.id)

	override initialise() {
		super.initialise()

		const partyMembers = this.parser.pull.actors
			.filter(actor => actor.playerControlled)
			.map(actor => actor.id)
		this.expectedCount = Math.min(partyMembers.length, FULL_PARTY_SIZE) // 24-mans count the other alliance members as 'party members' but you can't buff them...
		const playerOwnedIds = this.parser.pull.actors
			.filter(actor => (actor.owner === this.parser.actor) || actor === this.parser.actor)
			.map(actor => actor.id)
		const statusFilter = filter<Event>()
			.type('statusApply')
			.status(oneOf(ensureArray(this.buffStatus).map(s => s.id)))

		this.addEventHook(
			statusFilter
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

		if (this.evaluateOverwrites) {
			this.addEvaluator(new RaidBuffOverwriteEvaluator({
				raidBuffApplications: this.raidBuffApplications,
				buffStatus: this.buffStatus,
				playerId: this.parser.actor.id,
			}))
		}
	}

	private onRaidBuffApply(event: Events['statusApply']) {
		this.raidBuffApplications.push(event)
	}

	private affectedPlayers(buffWindow: HistoryEntry<EvaluatedAction[]>): number {
		const windowEnd = buffWindow?.end ?? buffWindow.start
		// count the number of player-sourced applications that happened in the window
		const affected = this.raidBuffApplications.filter(event => {
			return (buffWindow.start <= event.timestamp &&
				event.timestamp <= windowEnd &&
				event.source === this.parser.actor.id)
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
