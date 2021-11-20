import CastTime from 'parser/core/modules/CastTime'

const GREASED_LIGHTNING_MODIFIER = 0.8

export class GreasedLightning extends CastTime {
	private pomIndex: number | null = null

	override initialise() {
		super.initialise()

		this.setPercentageAdjustment('all', GREASED_LIGHTNING_MODIFIER, 'both')
	}
}
