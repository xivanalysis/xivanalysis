import {Defensives} from 'parser/core/modules/Defensives'

export class Mitigation extends Defensives {
	protected override trackedActions = [
		this.data.actions.DISMANTLE,
		this.data.actions.TACTICIAN,
	]
}
