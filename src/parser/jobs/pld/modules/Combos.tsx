import ACTIONS from 'data/ACTIONS'
import CoreCombos from 'parser/core/modules/Combos'

export default class Combos extends CoreCombos {
	// Overrides
	static override suggestionIcon = ACTIONS.ROYAL_AUTHORITY.icon
}
