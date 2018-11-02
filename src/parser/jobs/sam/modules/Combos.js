import CoreCombos from 'parser/core/modules/Combos'
import ACTIONS from 'data/ACTIONS'

export default class Combos extends CoreCombos {
	// Overrides
	static suggestionIcon = ACTIONS.HAKAZE.icon
}

// TODO: Need to allow janky combo actions when meikyo shushi or whatever the fuck it's called is active
