import {Event, Events} from 'event'
import {ensureArray} from 'utilities'
import {filter, oneOf} from '../../../filter'
import {ActionSpecifier} from '../../Cooldowns'
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
}
