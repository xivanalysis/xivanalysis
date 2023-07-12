import {Positionals as CorePositionals} from 'parser/core/modules/Positionals'

export class Positionals extends CorePositionals {
	positionals = [
		this.data.actions.CHAOTIC_SPRING,
		this.data.actions.FANG_AND_CLAW,
		this.data.actions.WHEELING_THRUST,
	]
}
