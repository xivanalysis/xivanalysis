import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

/*
GNB: There is no spefific opener, it's fight dependent
Also GNB: makes no easy track record of each fight by fight opener
*/

const FIRST_USE_OFFSET_NO_MERCY = 10000 // Current opener has NM used as before 4th gcd, but in second weave slot
const FIRST_USE_OFFSET_GNASHING_FANG = 10000 // used right after NM

const FIRST_USE_OFFSET_BLOODFEST = 12500 // Current Opener have bloodfest by after the 5th gcd

const FIRST_USE_OFFSET_PEWPEWZONE = 12500 // Current Opener has Blasting and Bow after 5th
const FIRST_USE_OFFSET_BOWSHOCK = 10000 //Current Opener has Bow Shock after 4th GCD

const FIRST_USE_OFFSET_DOUBLE_DOWN = 15000 //Curent Opener has double being used as 6th GCD. *GCD Skill*

const FIRST_USE_OFFSET_SONIC_BREAK = 12500 //Current Opener has Sonic Break as 5th GCD *GCD Skill*

export class AbilityDowntime extends CooldownDowntime { //Order by cooldown length

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
		},
	]
}
