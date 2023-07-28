import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'

export class Defensives extends CoreDefensives {
	protected override trackedDefensives = [
		this.data.actions.LIVING_DEAD,
		this.data.actions.SHADOW_WALL,
		this.data.actions.DARK_MISSIONARY,
		this.data.actions.OBLATION,
		this.data.actions.DARK_MIND,
	]
}
