import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

// +2s start of fight buffer added for all first use
// at high skill speeds, Battle Litany is first, so the order is a bit fluid,
// however all are used before the third GCD
const BUFF_FIRST_USE_OFFSET = 7000

// the high sks opener delays jumps to better line up with later windows,
// but isn't used with current sets. Timings listed here should work
// for both openers, if the high sks build ever becomes relevant.
const JUMP_FIRST_USE_OFFSET = 16100		// before 7th gcd
const SSD_FIRST_USE_OFFSET = 20800		// before 9th gcd
const DFD_FIRST_USE_OFFSET = 23500		// before 10th gcd

// always before Full Thrust, the 8th GCD
const LIFE_SURGE_FIRST_USE_OFFSET = 19500

export default class OGCDDowntime extends CooldownDowntime {
	defaultFirstUseOffset = BUFF_FIRST_USE_OFFSET
	trackedCds = [
		{
			cooldowns: [ACTIONS.HIGH_JUMP],
			firstUseOffset: JUMP_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [ACTIONS.SPINESHATTER_DIVE],
			firstUseOffset: SSD_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [ACTIONS.DRAGONFIRE_DIVE],
			firstUseOffset: DFD_FIRST_USE_OFFSET,
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
