import {Positionals as CorePositionals} from 'parser/core/modules/Positionals'

export class Positionals extends CorePositionals {
	positionals = [
		this.data.actions.DEMOLISH,
		this.data.actions.SNAP_PUNCH,
	]
}
