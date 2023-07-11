import {Positionals as CorePositionals} from 'parser/core/modules/Positionals'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class Positionals extends CorePositionals {
	static override displayOrder = DISPLAY_ORDER.POSITIONALS

	positionals = [
		this.data.actions.GIBBET,
		this.data.actions.GALLOWS,
	]
}
