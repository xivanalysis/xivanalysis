import ACTIONS from 'data/ACTIONS'
import CooldownDowntime from 'parser/core/modules/CooldownDowntime'

/* This offset allows for four weaponskills to be used before No Mercy in the
 * opener, as is currently recommended. Should be updated if openers change to
 * have later No Mercy.
 */
const FIRST_USE_OFFSET_NO_MERCY = 10000
/* This offset is large to account for the (mostly) single-weave opener, in
 * which Bloodfest is used after nine weaponskills.
 */
const FIRST_USE_OFFSET_BLOODFEST = 22000

export default class AbilityDowntime extends CooldownDowntime {
	allowedDowntime = 2500

	firstUseOffsetPerOgcd = {
		[ACTIONS.NO_MERCY.id]: FIRST_USE_OFFSET_NO_MERCY,
		[ACTIONS.BLOODFEST.id]: FIRST_USE_OFFSET_BLOODFEST,
	}

	trackedCds = [
		ACTIONS.NO_MERCY.id,
		ACTIONS.BLOODFEST.id,
		ACTIONS.BLASTING_ZONE.id, // Only track this one for now, assume level 80
		ACTIONS.ROUGH_DIVIDE.id,
		ACTIONS.BOW_SHOCK.id,
	]
}
