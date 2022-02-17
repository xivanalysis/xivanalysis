import {Event, Events} from 'event'
import {BuffWindow, EvaluatedAction, PlayersBuffedEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {ensureArray} from 'utilities'
import {filter, oneOf} from '../../../filter'

const FULL_PARTY = 8

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
	protected expectedCount = FULL_PARTY

	override initialise() {
		super.initialise()

		const partyMembers = this.parser.pull.actors
			.filter(actor => actor.playerControlled)
			.map(actor => actor.id)
		const playerOwnedIds = this.parser.pull.actors
			.filter(actor => (actor.owner === this.parser.actor) || actor === this.parser.actor)
			.map(actor => actor.id)

		const buffFilter = filter<Event>()
			.type('statusApply')
			.source(oneOf(playerOwnedIds))
			.target(oneOf(partyMembers))
			.status(oneOf(ensureArray(this.buffStatus).map(s => s.id)))

		this.addEventHook(buffFilter, this.onRaidBuffApply)

		this.addEvaluator(new PlayersBuffedEvaluator({
			expectedCount: this.expectedCount,
			affectedPlayers: this.affectedPlayers.bind(this),
		}))
	}

	private onRaidBuffApply(event: Events['statusApply']) {
		this.raidBuffApplications.push(event)
	}
	protected affectedPlayers(buffWindow: HistoryEntry<EvaluatedAction[]>): number {
		const actualWindowDuration = (buffWindow?.end ?? buffWindow.start) - buffWindow.start
		// count the number of applications that happened in the window
		const affected = this.raidBuffApplications.filter(event => {
			return (buffWindow.start <= event.timestamp &&
				event.timestamp <= buffWindow.start + actualWindowDuration)
		})

		return affected.length
	}
}
