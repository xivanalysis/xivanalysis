import {Defensives} from 'parser/core/modules/Defensives'

export class DefensiveCooldowns extends Defensives {
	protected override trackedDefensives = [
		this.data.actions.ARCANE_CREST,
		this.data.actions.FEINT,
		this.data.actions.SECOND_WIND,
		this.data.actions.BLOODBATH,
	]
}
