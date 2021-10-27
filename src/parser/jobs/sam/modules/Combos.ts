import ACTIONS from 'data/ACTIONS'
import {ActionCombo} from 'data/ACTIONS/type'
import STATUSES from 'data/STATUSES'
import {Events} from 'event'
import {dependency} from 'parser/core/Module'
import {Actors} from 'parser/core/modules/Actors'
import {Combos as CoreCombos} from 'parser/core/modules/Combos'

export class Combos extends CoreCombos {
	override suggestionIcon = ACTIONS.HAKAZE.icon

	@dependency private actors!: Actors

	override checkCombo(combo: ActionCombo, event: Events['damage']) {
		// If they've got Meikyo Shisui up, all combos are correct, and nothing combos together
		if (this.actors.current.hasStatus(STATUSES.MEIKYO_SHISUI.id) && event.cause.type === 'action' && event.cause.action !== ACTIONS.HAKAZE.id) {
			this.fabricateComboEvent(event)
			return false
		}

		return super.checkCombo(combo, event)
	}
}
