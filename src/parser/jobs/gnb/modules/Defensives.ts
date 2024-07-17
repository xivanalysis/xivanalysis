import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'
import DISPLAY_ORDER from 'parser/jobs/gnb/modules/DISPLAY_ORDER'

export class Defensives extends CoreDefensives {
	static override displayOrder = DISPLAY_ORDER.DEFENSIVES
	protected override trackedDefensives = [
		this.data.actions.SUPERBOLIDE,
		this.data.actions.GREAT_NEBULA,
		this.data.actions.HEART_OF_LIGHT,
		this.data.actions.HEART_OF_CORUNDUM,
		this.data.actions.AURORA,
		this.data.actions.CAMOUFLAGE,
	]
}
