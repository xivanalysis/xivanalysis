import ACTIONS from 'data/ACTIONS'
import CooldownDowntime from 'parser/core/modules/CooldownDowntime'

/* This offset allows for four weaponskills to be used before No Mercy in the
 * opener, as is currently recommended. Should be updated if openers change to
 * have later No Mercy.
 */
const FIRST_USE_OFFSET_NO_MERCY = 10000

export default class AbilityDowntime extends CooldownDowntime {
	allowedDowntime = 2500

	firstUseOffsetPerOgcd = {
		[ACTIONS.NO_MERCY.id]: FIRST_USE_OFFSET_NO_MERCY,
	}

	trackedCds = [
		ACTIONS.NO_MERCY.id,
		ACTIONS.BLASTING_ZONE.id, // Only track this one for now, assume level 80
		ACTIONS.ROUGH_DIVIDE.id,
		ACTIONS.BOW_SHOCK.id,
	]
}
