import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import CoreCombos from 'parser/core/modules/Combos'

export default class Combos extends CoreCombos {
	static suggestionIcon = ACTIONS.HAKAZE.icon

	@dependency private combatants!: Combatants

	// TODO: Type for the combo data once ACTIONS is typed
	checkCombo(combo: TODO, event: Event) {
		// If they've got Meikyo Shisui up, all combos are correct, and nothing combos together
		if (this.combatants.selected.hasStatus(STATUSES.MEIKYO_SHISUI.id)) {
			this.fabricateComboEvent(event)
			return false
		}

		return super.checkCombo(combo, event)
	}
}
