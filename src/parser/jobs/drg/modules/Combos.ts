import ACTIONS from 'data/ACTIONS'
import {Combos as CoreCombos} from 'parser/core/modules/Combos'

export class Combos extends CoreCombos {
	override suggestionIcon = ACTIONS.HEAVENS_THRUST.icon
}
