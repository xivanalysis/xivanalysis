import {Weaving as CoreWeaving, Weave} from 'parser/core/modules/Weaving'

// Due to Greased Lightning, Monk frequently hits GCD speeds that make double
// weaving without clipping really close to the wire, to the point implementation
// details such as server message delay can effect an effective GCD roll or not.
// Core weaving marks this breakpoint (with wiggle room) as 1-weave only, but monk
// realistically uses two weaves regardless in these situations, as the resultant
// clipping is insufficient to outweigh the damage benefit. We're hard overriding
// with a permitted double weave here to account for that case - the ABC module
// will report on any significant downtime stemming from this, or otherwise.
const REGULAR_MAX_WEAVES = 2
const SSS_MAX_WEAVES = 4

export class Weaving extends CoreWeaving {
	protected override getMaxWeaves(weave: Weave) {
		if (weave.leadingGcdEvent?.action === this.data.actions.SIX_SIDED_STAR.id) {
			return SSS_MAX_WEAVES
		}

		return REGULAR_MAX_WEAVES
	}
}
