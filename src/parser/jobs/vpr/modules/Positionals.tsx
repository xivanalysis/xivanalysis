import {Positionals as CorePositionals} from 'parser/core/modules/Positionals'

export class Positionals extends CorePositionals {
	positionals = [
		this.data.actions.HINDSBANE_FANG,
		this.data.actions.HINDSTING_STRIKE,
		this.data.actions.FLANKSBANE_FANG,
		this.data.actions.FLANKSTING_STRIKE,
	]
}
