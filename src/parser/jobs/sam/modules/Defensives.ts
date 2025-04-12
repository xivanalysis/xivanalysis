import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'

export class Defensives extends CoreDefensives {
	protected override trackedDefensives = [
		this.data.actions.TENGENTSU,
		this.data.actions.SECOND_WIND,
	]
}
