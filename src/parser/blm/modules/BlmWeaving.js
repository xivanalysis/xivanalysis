import Weaving from 'parser/core/modules/Weaving'
import ACTIONS from 'data/ACTIONS'

export default class BlmWeaving extends Weaving {
	isBadWeave(weave, maxWeaves) {
		if(weave.gcdEvent.ability)
		{
			switch(weave.gcdEvent.ability.guid)
			{
				case ACTIONS.FIRE_3.id:
				case ACTIONS.BLIZZARD_3.id:
					// TODO: Need extra checks to only allow fast-cast F3/B3
					const weaveCount = weave.weaves.filter(
						event => !this.invuln.isUntargetable('all', event.timestamp)
					).length
					if(weaveCount === 1)
					{
						return false
					}
					break;
				default:
			}
		}

		return super.isBadWeave(weave, maxWeaves)
	}
}
