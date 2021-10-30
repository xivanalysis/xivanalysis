import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {ensureArray} from 'utilities'
import {filter, oneOf} from '../../../filter'
import {ActionWindow} from './ActionWindow'

/**
 * Tracks actions that occur for a time period after an action was used by the player.
 * This should be used for actions that start a window but do not apply a status, such as Hypercharge
 */
export abstract class TimedWindow extends ActionWindow {

	/**
	 * Implementing modules MUST define the ACTION object that starts a window.
	 */
	abstract startAction: Action | Action[]
	/**
	 * Implementing modules MUST define the duration of a window in milliseconds
	 * from the time startAction is cast.
	 */
	abstract duration: number

	override initialise() {
		super.initialise()

		const startIds = ensureArray(this.startAction).map(a => a.id)
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
}
