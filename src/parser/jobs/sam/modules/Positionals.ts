import {Positionals as CorePositionals} from 'parser/core/modules/Positionals'

export class Positionals extends CorePositionals {
	positionals = [
		this.data.actions.GEKKO,
		this.data.actions.KASHA,
	]
}
