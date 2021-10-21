import ACTIONS from 'data/ACTIONS'
import CoreCombos from 'parser/core/modules/Combos'

export class Combos extends CoreCombos {
	// Overrides
	static override suggestionIcon = ACTIONS.SPINNING_EDGE.icon
}
