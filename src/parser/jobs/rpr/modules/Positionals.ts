import {Positionals as CorePositionals} from 'parser/core/modules/Positionals'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class Positionals extends CorePositionals {
	static override displayOrder = DISPLAY_ORDER.POSITIONALS

	positionals = [{
		action: this.data.actions.GIBBET,
	},
	{
		action: this.data.actions.GALLOWS,
	},
	]
}
