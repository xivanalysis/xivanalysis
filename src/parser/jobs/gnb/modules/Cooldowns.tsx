import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

/*
GNB: There is no spefific opener, it's fight dependent
Also GNB: makes no easy track record of each fight by fight opener

Currently there is the <=2.47 and the 2.5 opener. Most will run the 2.5 opener, but some will run the <=2.47 opener, so I've chosen to set the offsets to the 2.47 opener as they use the skills later.

*Current offsets are based off: 6.4 Opener / Standard (https://media.discordapp.net/attachments/1034203718045945967/1115142069615329320/9GCDOPENER.png?format=webp&quality=lossless&width=2050&height=574)
*Note: 2.5 Opener will use skills faster but the module will adjust for that.

*All values are seperate in case the current ones fall out of favor in the future
*/

const FIRST_USE_OFFSET_NO_MERCY = 10000 // Current opener has NM used as before 4th gcd, but in second weave slot
const FIRST_USE_OFFSET_GNASHING_FANG = 10000 // used right after NM

const FIRST_USE_OFFSET_BLOODFEST = 12500 // Current Opener have bloodfest by after the 5th gcd

const FIRST_USE_OFFSET_PEWPEWZONE = 12500 // Current Opener has Blasting and Bow after 5th
const FIRST_USE_OFFSET_BOWSHOCK = 10000 //Current Opener has Bow Shock after 4th GCD

const FIRST_USE_OFFSET_DOUBLE_DOWN = 15000 //Curent Opener has double being used as 6th GCD. *GCD Skill*

const FIRST_USE_OFFSET_DIVIDE = 15000 //Current Opener has rough divide set to be after 6th GCD

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
			cooldowns: [this.data.actions.ROUGH_DIVIDE],
			firstUseOffset: FIRST_USE_OFFSET_DIVIDE, // but not by 0.
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
