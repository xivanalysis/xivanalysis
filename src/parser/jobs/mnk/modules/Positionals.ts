import {Positionals as CorePositionals} from 'parser/core/modules/Positionals'

export class Positionals extends CorePositionals {
	positionals = [{
		action: this.data.actions.DEMOLISH,
	},
	{
		action: this.data.actions.SNAP_PUNCH,
	},
	]
}
