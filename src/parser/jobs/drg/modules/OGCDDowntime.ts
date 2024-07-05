import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

// TODO: check when release happens and openers get crafted a bit more, offsets might be a bit tight in this revision

// +2s start of fight buffer added for all first use
// at high skill speeds, Battle Litany is first, so the order is a bit fluid,
// however all are used before the fourth GCD
const BUFF_FIRST_USE_OFFSET = 7000

// ordering for jumps and GSK can shift, though LS is constant
// Currenly, last jump (DFD usually) is used before 6th GCD
const JUMP_FIRST_USE_OFFSET = 14500

// always before Drakesbane, the 5th GCD
const LIFE_SURGE_FIRST_USE_OFFSET = 12000

export default class OGCDDowntime extends CooldownDowntime {
	override defaultFirstUseOffset = BUFF_FIRST_USE_OFFSET
	override trackedCds = [
		{
			cooldowns: [this.data.actions.HIGH_JUMP],
			firstUseOffset: JUMP_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [this.data.actions.GEIRSKOGUL],
			firstUseOffset: JUMP_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [this.data.actions.DRAGONFIRE_DIVE],
			firstUseOffset: JUMP_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [this.data.actions.LIFE_SURGE],
			firstUseOffset: LIFE_SURGE_FIRST_USE_OFFSET,
		},
		{cooldowns: [this.data.actions.LANCE_CHARGE]},
		{cooldowns: [this.data.actions.BATTLE_LITANY]},
	]
}
