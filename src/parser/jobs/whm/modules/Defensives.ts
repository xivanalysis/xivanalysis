import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'

export class Defensives extends CoreDefensives {
	protected override trackedDefensives = [
		this.data.actions.LITURGY_OF_THE_BELL,
		this.data.actions.ASYLUM,
		this.data.actions.AQUAVEIL,
		this.data.actions.DIVINE_BENISON,
		this.data.actions.TEMPERANCE,
	]
}
