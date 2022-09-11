import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

/*
GNB: There is no spefific opener, it's fight dependent
Also GNB: makes no easy track record of each fight by fight opener

That being said, 1NM23 is the "general all rounder" opener for blind prog,
1NM23 captures all big buttons with raid buffs unlike the 6.0 123NM opener that *may* miss

*Current offsets are based off: 6.1 Opener / 1NM23 (https://media.discordapp.net/attachments/441424599310270464/1010362485578145842/unknown.png?width=1664&height=936)
*Note: This infograph is out of date due to it using 6.1 BF, but the opener offsets are the safe.

*All values are seperate in case the current ones fall out of favor in the future
*/

const FIRST_USE_OFFSET_NO_MERCY = 2500 // Current opener has NM used as before 2nd gcd, but in second weave slot

const FIRST_USE_OFFSET_BLOODFEST = 10000 // Current Opener have bloodfest by after the 4th gcd

const FIRST_USE_OFFSET_PEWPEWZONE = 12500 // Current Opener has Blasting and Bow after 5th
const FIRST_USE_OFFSET_BOWSHOCK = 12500

const FIRST_USE_OFFSET_DOUBLE_DOWN = 12500 //Curent Opener has double being used as 5th GCD. *GCD Skill*

const FIRST_USE_OFFSET_DIVIDE = 15000 //Current Opener has rough divide set to be after 6th GCD

const FIRST_USE_OFFSET_SONIC_BREAK = 15000 //Current Opener has Sonic Break as 6th GCD *GCD Skill*

export class AbilityDowntime extends CooldownDowntime {

	trackedCds = [
		{
			cooldowns: [this.data.actions.NO_MERCY],
			firstUseOffset: FIRST_USE_OFFSET_NO_MERCY,
		},
		{
			cooldowns: [this.data.actions.BLOODFEST],
			firstUseOffset: FIRST_USE_OFFSET_BLOODFEST,
		},
		{
			cooldowns: [this.data.actions.DOUBLE_DOWN],
			firstUseOffset: FIRST_USE_OFFSET_DOUBLE_DOWN,
		},
		{
			cooldowns: [this.data.actions.SONIC_BREAK],
			firseUseOffset: FIRST_USE_OFFSET_SONIC_BREAK,
		},
		{
			cooldowns: [this.data.actions.BLASTING_ZONE, this.data.actions.DANGER_ZONE],
			firstUseOffset: FIRST_USE_OFFSET_PEWPEWZONE,
		},
		{
			cooldowns: [this.data.actions.BOW_SHOCK],
			firstUseOffset: FIRST_USE_OFFSET_BOWSHOCK,
		},
		{
			cooldowns: [this.data.actions.ROUGH_DIVIDE],
			firstUseOffset: FIRST_USE_OFFSET_DIVIDE, // but not by 0.
		},
	]
}
