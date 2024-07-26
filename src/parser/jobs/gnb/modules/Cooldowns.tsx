import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

/*
GNB: There is no spefific opener, it's fight dependent
Also GNB: makes no easy track record of each fight by fight opener
*/

// https://i.imgur.com/zIPcinP.png 2.4X Opener (9 GCD)
// https://imgur.com/adXPxrb 2.5 GCD opener

/*
GNB Opener offsets:
________________________________________________
|Skill         | 2.4x Opener   | 2.5 Opener    |
|----------------------------------------------|
|Bloodfest     | After 1st GCD | After 2nd GCD |
|No Mercy      | After 2nd GCD | After 2nd GCD |
|Gnashing Fang | 3rd GCD       | 5th GCD       |
|Bow Shock     | After 4th GCD | After 3rd GCD |
|Blasting Zone | After 5th GCD | After 4th GCD |
|Double Down   | 4th GCD       | 4th GCD       |
|Sonic Break   | 5th GCD       | 3rd GCD       |
|______________|_______________|_______________|

Quick Maths, 2500 * GCD # = Offset, take the higher number for the offset.
*/

const FIRST_USE_OFFSET_BLOODFEST = 5000
const ALLOWED_BLOODFEST_HOLDTIME = 10000 // Bloodfest is allowed to be held in order to delay it back under buffs, this should be a maximum of 4 GCDs, 2 ahead of NM, 2 after NM cast to dump ammo.

const FIRST_USE_OFFSET_NO_MERCY = 5000
const FIRST_USE_OFFSET_GNASHING_FANG = 12500
const FIRST_USE_OFFSET_BOWSHOCK = 10000
const FIRST_USE_OFFSET_PEWPEWZONE = 12500
const FIRST_USE_OFFSET_DOUBLE_DOWN = 10000
const FIRST_USE_OFFSET_SONIC_BREAK = 12500

export class AbilityDowntime extends CooldownDowntime { // Order by cooldown length

	trackedCds = [
		{
			cooldowns: [this.data.actions.GNASHING_FANG],
			firstUseOffset: FIRST_USE_OFFSET_GNASHING_FANG,
		},
		{
			cooldowns: [this.data.actions.BLASTING_ZONE, this.data.actions.DANGER_ZONE],
			firstUseOffset: FIRST_USE_OFFSET_PEWPEWZONE,
		},
		{
			cooldowns: [this.data.actions.NO_MERCY],
			firstUseOffset: FIRST_USE_OFFSET_NO_MERCY,
		},
		{
			cooldowns: [this.data.actions.SONIC_BREAK],
			firseUseOffset: FIRST_USE_OFFSET_SONIC_BREAK,
		},
		{
			cooldowns: [this.data.actions.BOW_SHOCK],
			firstUseOffset: FIRST_USE_OFFSET_BOWSHOCK,
		},
		{
			cooldowns: [this.data.actions.DOUBLE_DOWN],
			firstUseOffset: FIRST_USE_OFFSET_DOUBLE_DOWN,
		},
		{
			cooldowns: [this.data.actions.BLOODFEST],
			firstUseOffset: FIRST_USE_OFFSET_BLOODFEST,
			allowedAverageDowntime: ALLOWED_BLOODFEST_HOLDTIME,
		},
	]
}
