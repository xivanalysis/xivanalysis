import {Event} from 'event'
import {ensureArray} from 'utilities'
import {filter, oneOf} from '../../../filter'
import {ActionSpecifier} from '../../Cooldowns'
import {ActionWindow} from './ActionWindow'

/**
 * Tracks actions that occur between casts of an action by the player.
 * This should be used for actions that start a window that lasts until the next cast
 * of the skill, such as Aetherflow windows.
 */
export abstract class RestartWindow extends ActionWindow {

	/**
	 * Implementing modules MUST define the ACTION object that starts a window.
	 */
	abstract startAction: ActionSpecifier | ActionSpecifier[]

	override initialise() {
		super.initialise()

		const startIds = ensureArray(this.startAction)
			.map(action => typeof action === 'string' ? this.data.actions[action].id : action.id)
		this.addEventHook(
			filter<Event>().source(this.parser.actor.id)
				.action(oneOf(startIds))
				.type('action'),
			(event) => this.onWindowStart(event.timestamp))
		// No explicit end hook. Windows continue until the next cast or end of pull.
	}
}
