import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

// +2s start of fight buffer added for all first use
// at high skill speeds, Battle Litany is first, so the order is a bit fluid,
// however all are used before the third GCD
const BUFF_FIRST_USE_OFFSET = 7000

// ordering for jumps and GSK can shift, though LS is constant
const JUMP_FIRST_USE_OFFSET = 17500

// always before Full Thrust, the 8th GCD
const LIFE_SURGE_FIRST_USE_OFFSET = 20000

export default class OGCDDowntime extends CooldownDowntime {
	defaultFirstUseOffset = BUFF_FIRST_USE_OFFSET
	trackedCds = [
		{
			cooldowns: [ACTIONS.HIGH_JUMP],
			firstUseOffset: JUMP_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [ACTIONS.GEIRSKOGUL],
			firstUseOffset: JUMP_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [ACTIONS.SPINESHATTER_DIVE],
			firstUseOffset: JUMP_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [ACTIONS.DRAGONFIRE_DIVE],
			firstUseOffset: JUMP_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [ACTIONS.LIFE_SURGE],
			firstUseOffset: LIFE_SURGE_FIRST_USE_OFFSET,
		},
		{cooldowns: [ACTIONS.LANCE_CHARGE]},
		{cooldowns: [ACTIONS.DRAGON_SIGHT]},
		{cooldowns: [ACTIONS.BATTLE_LITANY]},
	]
}
