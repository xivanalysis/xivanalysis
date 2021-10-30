import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import {TimestampHook, TimestampHookArguments} from 'parser/core/Dispatcher'
import {ensureArray} from 'utilities'
import {filter, noneOf, oneOf} from '../../../filter'
import {HistoryEntry} from '../../History'
import {EvaluatedAction} from '../EvaluatedAction'
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
	 * Implementing modules MUST define the STATUS object for the status that represents the buff window.
	 */
	abstract buffStatus: Status | Status[]

	/**
	 * Determines if a window ended early due to the end of the pull.
	 * @param window The window to check
	 * @returns True if the window is shorter than the expected duration of the buff because of the end
	 * of the pull; false otherwise.
	 */
	protected isRushedEndOfPullWindow(window: HistoryEntry<EvaluatedAction[]>) {
		const expectedDuration = (ensureArray(this.buffStatus)[0].duration ?? 0)
		const fightTimeRemaining = (this.parser.pull.timestamp + this.parser.pull.duration) - window.start
		return expectedDuration >= fightTimeRemaining
	}

	private durationHook?: TimestampHook

	override initialise() {
		super.initialise()

		// need to check source and target due to buff mirroring. Check for noneOf pets
		// to allow debuff based windows such as Trick Attack to work through this class.
		const pets = this.parser.pull.actors
			.filter(actor => actor.owner === this.parser.actor)
			.map(actor => actor.id)
		const playerFilter = filter<Event>().source(this.parser.actor.id).target(noneOf(pets))
		const buffFilter = playerFilter.status(oneOf(ensureArray(this.buffStatus).map(s => s.id)))

		this.addEventHook(buffFilter.type('statusApply'), this.startWindowAndTimeout)
		this.addEventHook(buffFilter.type('statusRemove'), this.endWindowByStatus)
	}

	private startWindowAndTimeout(event: Events['statusApply']) {
		this.onWindowStart(event.timestamp)
		const duration = ensureArray(this.buffStatus)[0].duration
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
