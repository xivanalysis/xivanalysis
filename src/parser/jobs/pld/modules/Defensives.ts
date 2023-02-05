import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'

export class Defensives extends CoreDefensives {
	protected override trackedDefensives = [
		this.data.actions.HALLOWED_GROUND,
		this.data.actions.SENTINEL,
		this.data.actions.HOLY_SHELTRON,
		this.data.actions.PASSAGE_OF_ARMS,
		this.data.actions.DIVINE_VEIL,
		this.data.actions.INTERVENTION,
		this.data.actions.COVER,
		this.data.actions.BULWARK,
	]
}
