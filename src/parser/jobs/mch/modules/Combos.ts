import ACTIONS from 'data/ACTIONS'
import {Combos as CoreCombos} from 'parser/core/modules/Combos'

export class Combos extends CoreCombos {
	// Overrides
	override suggestionIcon = ACTIONS.HEATED_SPLIT_SHOT.icon
}
