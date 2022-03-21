import {Positionals as CorePositionals} from 'parser/core/modules/Positionals'

export class Positionals extends CorePositionals {
	positionals = [{
		action: this.data.actions.GIBBET,
	},
	{
		action: this.data.actions.GALLOWS,
	},
	]
}
