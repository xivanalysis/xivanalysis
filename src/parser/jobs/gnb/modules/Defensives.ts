import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'

export class Defensives extends CoreDefensives {
	protected override trackedDefensives = [
		this.data.actions.SUPERBOLIDE,
		this.data.actions.NEBULA,
		this.data.actions.HEART_OF_LIGHT,
		this.data.actions.HEART_OF_CORUNDUM,
		this.data.actions.AURORA,
		this.data.actions.CAMOUFLAGE,
	]
}
