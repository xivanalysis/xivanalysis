import {Combos as CoreCombos} from 'parser/core/modules/Combos'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class Combos extends CoreCombos {
	static override displayOrder = DISPLAY_ORDER.COMBOS

	override suggestionIcon = this.data.actions.WAXING_SLICE.icon
}
