import {Defensives} from 'parser/core/modules/Defensives'

export class Mitigation extends Defensives {
	protected override trackedDefensives = [
		this.data.actions.DISMANTLE,
		this.data.actions.TACTICIAN,
	]
}
