import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import _ from 'lodash'
import {TimestampHook, TimestampHookArguments} from 'parser/core/Dispatcher'
import {ensureArray} from 'utilities'
import {filter, oneOf} from '../../../filter'
import {EvaluatedAction} from '../EvaluatedAction'
import {HistoryEntry} from '../History'
import {ActionWindow} from './ActionWindow'

const SECONDS_TO_MS: number = 1000

// In true XIV fashion, statuses tend to stick around for slightly longer than
// their specified duration. It's pretty consistently about a second, so we're
// adding that as a fudge.
const STATUS_DURATION_FUDGE = SECONDS_TO_MS

/**
 * Tracks actions that occur while a buff status is active on the player.
 */
export abstract class BuffWindow extends ActionWindow {

	/**
	 * The status that the buff window tracks.
	 */
	abstract buffStatus: Status | Status[]

	/**
	 * Determines if a window ended early due to the end of the pull.
	 * @param window The window to check
	 * @returns True if the window is shorter than the expected duration of the buff because of the end
	 * of the pull; false otherwise.
	 */
	protected isRushedEndOfPullWindow(window: HistoryEntry<EvaluatedAction[]>) {
		const expectedDuration = this.buffDuration ?? 0
		const fightTimeRemaining = (this.parser.pull.timestamp + this.parser.pull.duration) - window.start
		return expectedDuration >= fightTimeRemaining
	}

	private buffDuration?: number
	private durationHook?: TimestampHook

	override initialise() {
		super.initialise()

		// buff windows are either active on the parser's actor
		// or on an enemy actor (trick attack)
		// enemies are not on the same team as the parser actor
		const enemyTargets = this.parser.pull.actors
			.filter(actor => actor.team !== this.parser.actor.team)
			.map(actor => actor.id)

		const targets = [this.parser.actor.id, ...enemyTargets]
		const playerOwnedIds = this.parser.pull.actors
			.filter(actor => (actor.owner === this.parser.actor) || actor === this.parser.actor)
			.map(actor => actor.id)

		const buffFilter = filter<Event>()
			.source(oneOf(playerOwnedIds))
			.target(oneOf(targets))
			.status(oneOf(ensureArray(this.buffStatus).map(s => s.id)))

		this.addEventHook(buffFilter.type('statusApply'), this.onStatusApply)
		this.addEventHook(buffFilter.type('statusRemove'), this.onStatusRemove)
		this.buffDuration = _.max(ensureArray(this.buffStatus).map(s => s.duration))
	}

	private onStatusApply(event: Events['statusApply']) {
		this.startWindowAndTimeout(event.timestamp)
	}

	/**
	 * Start window at the timestamp provided and attach hook for closing the window
	 * after the duration of the buff.
	 *
	 * Visible for RaidBuffWindow to reopen windows.
	 * @param timestamp Time of buff application.
	 */
	protected startWindowAndTimeout(timestamp: number) {
		this.onWindowStart(timestamp)
		if (this.buffDuration == null) { return }
		if (this.durationHook != null) {
			this.removeTimestampHook(this.durationHook)
		}
		this.durationHook = this.addTimestampHook(timestamp + this.buffDuration + STATUS_DURATION_FUDGE,
			this.endWindowByTime)
	}

	private onStatusRemove(event: Events['statusRemove']) {
		this.onWindowEnd(event.timestamp)
		if (this.durationHook != null) {
			this.removeTimestampHook(this.durationHook)
			this.durationHook = undefined
		}
	}

	private endWindowByTime(event: TimestampHookArguments) {
		this.onWindowEnd(event.timestamp)
		this.durationHook = undefined
	}
}
