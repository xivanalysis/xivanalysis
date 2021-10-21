import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

/*
*Current offsets are based off: 5.21 openers
*All values are seperate in case the current ones fall out of favor in the future
*/

const FIRST_USE_OFFSET_NO_MERCY = 2500 // Current openers have no mercy be pre-pull or first GCD

const FIRST_USE_OFFSET_BLOODFEST = 2500 // Current Openers have bloodfest by after the first GCD

const FIRST_USE_OFFSET_PEWPEWZONE = 10000 // Current openers have Zone being used somewhere between after 2nd GCD to after 4th GCD, set to maximum

const FIRST_USE_OFFSET_BOWSHOCK = 10000 // Current Openers have Bowblast being used somewhere between after 2nd GCD to after 4th GCD, set to maximum

const FIRST_USE_OFFSET_DIVIDE = 7500 // Current Openers have rough divide at 3rd GCD or literally on pull. set to 3rd GCD

const FIRST_USE_OFFSET_SONIC_BREAK = 12500 // Current Openers have the longest delay for Sonic break being on 5th GCD (Raid Buffer Opener)

export default class AbilityDowntime extends CooldownDowntime {

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
