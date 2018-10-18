import CoreCooldowns from 'parser/core/modules/Cooldowns'
import ACTIONS from 'data/ACTIONS'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		ACTIONS.BATTLE_LITANY.id,
		ACTIONS.DRAGON_SIGHT.id,
		ACTIONS.BLOOD_FOR_BLOOD.id,
		ACTIONS.JUMP.id,
		ACTIONS.SPINESHATTER_DIVE.id,
		ACTIONS.MIRAGE_DIVE.id,
		ACTIONS.GEIRSKOGUL.id,
		ACTIONS.NASTROND.id,
		ACTIONS.DRAGONFIRE_DIVE.id,
		ACTIONS.LIFE_SURGE.id,
		ACTIONS.BLOOD_OF_THE_DRAGON.id,
		ACTIONS.ELUSIVE_JUMP.id,
	]
}
