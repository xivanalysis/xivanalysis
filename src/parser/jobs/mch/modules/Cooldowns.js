import CoreCooldowns from 'parser/core/modules/Cooldowns'
import ACTIONS from 'data/ACTIONS'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		ACTIONS.WILDFIRE.id,
		ACTIONS.DETONATOR.id,
		ACTIONS.GAUSS_ROUND.id,
		ACTIONS.RICOCHET.id,
		ACTIONS.HYPERCHARGE.id,
		ACTIONS.BARREL_STABILIZER.id,
		ACTIONS.REASSEMBLE.id,
		ACTIONS.AUTOMATON_QUEEN.id,
		ACTIONS.QUEEN_OVERDRIVE.id,
		ACTIONS.TACTICIAN.id,
		ACTIONS.FLAMETHROWER.id,
	]
}
