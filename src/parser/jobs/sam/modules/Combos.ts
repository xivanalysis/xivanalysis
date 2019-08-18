import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {dependency} from 'parser/core/Module'
import {AoeEvent} from 'parser/core/modules/AoE'
import Combatants from 'parser/core/modules/Combatants'
import CoreCombos, {ComboEvent} from 'parser/core/modules/Combos'

export default class Combos extends CoreCombos {
	static suggestionIcon = ACTIONS.HAKAZE.icon

	@dependency private combatants!: Combatants

	checkCombo(combo: ComboEvent, event: AoeEvent) {
		// If they've got Meikyo Shisui up, all combos are correct, and nothing combos together
		if (this.combatants.selected.hasStatus(STATUSES.MEIKYO_SHISUI.id) && (event.ability.guid !== ACTIONS.HAKAZE.id)) {
			this.fabricateComboEvent(event)
			return false
		}

		return super.checkCombo(combo, event)
	}
}
