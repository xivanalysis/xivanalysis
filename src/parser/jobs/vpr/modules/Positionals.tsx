import {Positionals as CorePositionals} from 'parser/core/modules/Positionals'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export class Positionals extends CorePositionals {
	static override displayOrder = DISPLAY_ORDER.POSITIONALS
	positionals = [
		this.data.actions.HINDSBANE_FANG,
		this.data.actions.HINDSTING_STRIKE,
		this.data.actions.FLANKSBANE_FANG,
		this.data.actions.FLANKSTING_STRIKE,
		this.data.actions.SWIFTSKINS_COIL,
		this.data.actions.HUNTERS_COIL,
	]
}
