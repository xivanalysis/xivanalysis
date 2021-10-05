import CastTime from 'parser/core/modules/CastTime'

const HUTON_MODIFIER = 0.85

// This is a TEMPORARY workaround to the lack of a status for Huton, only until the Huton module can be ported to Analyser (requires Combos to be ported)
//   Move this to the Huton module so it synthesizes the CastTime adjustment after it is ported
export class HutonCastTime extends CastTime {
	private pomIndex: number | null = null

	override initialise() {
		super.initialise()

		this.setPercentageAdjustment('all', HUTON_MODIFIER, 'both')
	}
}
