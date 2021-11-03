import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import {TimestampHook, TimestampHookArguments} from 'parser/core/Dispatcher'
import {filter, noneOf} from '../../../filter'
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
	abstract buffStatus: Status

	/**
	 * Determines if a window ended early due to the end of the pull.
	 * @param window The window to check
	 * @returns True if the window is shorter than the expected duration of the buff because of the end
	 * of the pull; false otherwise.
	 */
	protected isRushedEndOfPullWindow(window: HistoryEntry<EvaluatedAction[]>) {
		const expectedDuration = this.buffStatus.duration ?? 0
		const fightTimeRemaining = (this.parser.pull.timestamp + this.parser.pull.duration) - window.start
		return expectedDuration >= fightTimeRemaining
	}

	private durationHook?: TimestampHook

	override initialise() {
		super.initialise()

		// need to exclude pets to avoid getting duplicate window starts due to pet buff mirroring.
		const pets = this.parser.pull.actors
			.filter(actor => actor.owner === this.parser.actor)
			.map(actor => actor.id)
		const playerFilter = filter<Event>().source(this.parser.actor.id).target(noneOf(pets))
		const buffFilter = playerFilter.status(this.buffStatus.id)

		this.addEventHook(buffFilter.type('statusApply'), this.startWindowAndTimeout)
		this.addEventHook(buffFilter.type('statusRemove'), this.endWindowByStatus)
	}

	private startWindowAndTimeout(event: Events['statusApply']) {
		this.onWindowStart(event.timestamp)
		const duration = this.buffStatus.duration
		if (duration == null) { return }
		if (this.durationHook != null) {
			this.removeTimestampHook(this.durationHook)
		}
		this.durationHook = this.addTimestampHook(event.timestamp + duration + STATUS_DURATION_FUDGE,
			this.endWindowByTime)
	}

	private endWindowByStatus(event: Events['statusRemove']) {
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
