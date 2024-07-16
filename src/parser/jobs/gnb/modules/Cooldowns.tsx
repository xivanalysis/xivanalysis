import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

/*
GNB: There is no spefific opener, it's fight dependent
Also GNB: makes no easy track record of each fight by fight opener
*/

// https://i.imgur.com/rmc2s11.png 9 GCD NM opener
// https://i.imgur.com/f6Jwf9I.png 2.5 GCD opener

const FIRST_USE_OFFSET_NO_MERCY = 7500 // No Mercy after 3rd GCD
const FIRST_USE_OFFSET_GNASHING_FANG = 10000 // used as 4th GCD *GCD Skill*

const FIRST_USE_OFFSET_BLOODFEST = 12500 //used right after the 5th GCD of the opener

const FIRST_USE_OFFSET_PEWPEWZONE = 15000 // Current Opener has Blasting after 5th GCD
const FIRST_USE_OFFSET_BOWSHOCK = 15000 //Current Opener has Bow Shock after 5th GCD

const FIRST_USE_OFFSET_DOUBLE_DOWN = 12500 //Curent Opener has double being used as 5th GCD. *GCD Skill*

const FIRST_USE_OFFSET_SONIC_BREAK = 30000 // Sonic Break is either used as 6th GCD for 2.5, or 12 GCD on <2.47 builds *GCD Skill*

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
