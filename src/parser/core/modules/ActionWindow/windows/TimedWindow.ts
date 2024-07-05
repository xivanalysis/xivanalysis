import {Event, Events} from 'event'
import {ensureArray} from 'utilities'
import {filter, oneOf} from '../../../filter'
import {ActionSpecifier} from '../../Cooldowns'
import {EvaluatedAction} from '../EvaluatedAction'
import {HistoryEntry} from '../History'
import {ActionWindow} from './ActionWindow'

/**
 * Tracks actions that occur for a time period after an action was used by the player.
 * This should be used for actions that start a window but do not apply a status, such as Hypercharge
 */
export abstract class TimedWindow extends ActionWindow {

	/**
	 * One or more actions that start a window.
	 */
	abstract startAction: ActionSpecifier | ActionSpecifier[]
	/**
	 * Implementing modules MUST define the duration of a window in milliseconds
	 * from the time startAction is cast.
	 */
	abstract duration: number

	override initialise() {
		super.initialise()

		const startIds = ensureArray(this.startAction)
			.map(action => typeof action === 'string' ? this.data.actions[action].id : action.id)
		this.addEventHook(
			filter<Event>().source(this.parser.actor.id)
				.action(oneOf(startIds))
				.type('action'),
			this.startWindowAndTimeout)
	}

	private startWindowAndTimeout(event: Events['action']) {
		this.onWindowStart(event.timestamp)
		this.addTimestampHook(event.timestamp + this.duration,
			(endArgs) => this.onWindowEnd(endArgs.timestamp))
	}

	/**
	 * Determines if a window ended early due to the end of the pull.
	 * @param window The window to check
	 * @returns True if the window is shorter than the expected duration of the buff because of the end
	 * of the pull; false otherwise.
	 */
	protected isRushedEndOfPullWindow(window: HistoryEntry<EvaluatedAction[]>) {
		const expectedDuration = this.duration ?? 0
		const fightTimeRemaining = (this.parser.pull.timestamp + this.parser.pull.duration) - window.start
		return expectedDuration >= fightTimeRemaining
	}
}
