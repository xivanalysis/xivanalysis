import ACTIONS from 'data/ACTIONS'
import {ActionCombo} from 'data/ACTIONS/type'
import STATUSES from 'data/STATUSES'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Combos as CoreCombos} from 'parser/core/modules/Combos'

export class Combos extends CoreCombos {
	override suggestionIcon = ACTIONS.HAKAZE.icon

	@dependency private actors!: Actors

	override initialise() {
		super.initialise()

		this.addEventHook(
			filter<Event>()
				.type('action')
				.source(this.parser.actor.id)
				.action(ACTIONS.MEIKYO_SHISUI.id),
			this.onBreakerCast
		)
	}

	override checkCombo(combo: ActionCombo, event: Events['damage']) {
		// If they've got Meikyo Shisui up, all combos are correct, and nothing combos together
		if (this.actors.current.hasStatus(STATUSES.MEIKYO_SHISUI.id) && event.cause.type === 'action' && event.cause.action !== ACTIONS.HAKAZE.id) {
			this.fabricateComboEvent(event)
			return false
		}

		return super.checkCombo(combo, event)
	}

	private onBreakerCast(event: Events['action']) {
		const action = this.data.getAction(event.action)
		if (action == null) {
			return
		}

		if (action.breaksCombo && this.lastAction != null) {
			this.recordBrokenCombo({timestamp: event.timestamp, cause: {type: 'action', action: event.action}})
		}
	}
}
