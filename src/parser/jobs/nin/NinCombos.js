import ACTIONS from 'data/ACTIONS'
import Combos from 'parser/core/modules/Combos'

export default class NinCombos extends Combos {
	static handle = 'combos'

	// Overrides
	static suggestionIcon = ACTIONS.SPINNING_EDGE.icon

	comboHit(/*event*/) {
		// One day, this will be used for Huton tracking. But today is not that day.
	}
}
