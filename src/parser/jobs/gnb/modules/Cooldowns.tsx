import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

/*
*Current offsets are based off: 6.0 Opener (https://media.discordapp.net/attachments/879555876648812554/919201930583109632/123NMGF.jpg?width=1193&height=671)
*All values are seperate in case the current ones fall out of favor in the future
*/

const FIRST_USE_OFFSET_NO_MERCY = 7500 // Current opener has No mercy as 3after 3rd ogcd slot

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
