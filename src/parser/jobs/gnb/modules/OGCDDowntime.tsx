import ACTIONS from 'data/ACTIONS'
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

export default class AbilityDowntime extends CooldownDowntime {

	firstUseOffsetPerOgcd = {
		[ACTIONS.NO_MERCY.id]: FIRST_USE_OFFSET_NO_MERCY,
		[ACTIONS.BLOODFEST.id]: FIRST_USE_OFFSET_BLOODFEST,
	}

	trackedCds = [
		{
			cooldowns: [ACTIONS.NO_MERCY],
			firstUseOffset: FIRST_USE_OFFSET_NO_MERCY,
		},
		{
			cooldowns: [ACTIONS.BLOODFEST],
			firstUseOffset: FIRST_USE_OFFSET_BLOODFEST,
		},
		{
			cooldowns: [ACTIONS.BLASTING_ZONE, ACTIONS.DANGER_ZONE],
			firstUseOffset: FIRST_USE_OFFSET_PEWPEWZONE,
		},
		{
			cooldowns: [ACTIONS.BOW_SHOCK],
			firstUseOffset: FIRST_USE_OFFSET_BOWSHOCK,
		},
		{
			cooldowns: [ACTIONS.ROUGH_DIVIDE],
			firstUseOffset: FIRST_USE_OFFSET_DIVIDE, // but not by 0.
		},
	]
}
