import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'

export class Defensives extends CoreDefensives {
	protected override trackedDefensives = [
		this.data.actions.HOLMGANG,
		this.data.actions.VENGEANCE,
		this.data.actions.BLOODWHETTING,
		this.data.actions.SHAKE_IT_OFF,
		this.data.actions.NASCENT_FLASH,
		this.data.actions.THRILL_OF_BATTLE,
		this.data.actions.EQUILIBRIUM,
	]
}
