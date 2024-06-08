import {Positionals as CorePositionals} from 'parser/core/modules/Positionals'

export class Positionals extends CorePositionals {
	positionals = [
		this.data.actions.ARMOR_CRUSH,
		this.data.actions.AEOLIAN_EDGE,
	]
}
