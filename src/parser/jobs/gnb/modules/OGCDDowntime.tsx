import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

/* This offset allows for four weaponskills to be used before No Mercy in the
 * opener, as is currently recommended. Should be updated if openers change to
 * have later No Mercy.
 */
const FIRST_USE_OFFSET_NO_MERCY = 10000
/* This offset is large to account for the (mostly) single-weave opener, in
 * which Bloodfest is used after nine weaponskills.
 */
const FIRST_USE_OFFSET_BLOODFEST = 22000

const FIRST_USE_OFFSET_BOWBLAST = 17500 // The BowBlast combo is appiled at a maximum of 7 GCDs in current viable openers but can be applied as soon as 5 GCDs

const FIRST_USE_OFFSET_DIVIDE = 27500 // The rough divide is used at upto 11 GCDs out (single weave) but can be used as early as 8

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
			firstUseOffset: FIRST_USE_OFFSET_BOWBLAST,
		},
		{
			cooldowns: [ACTIONS.BOW_SHOCK],
			firstUseOffset: FIRST_USE_OFFSET_BOWBLAST,
		},
		{
			cooldowns: [ACTIONS.ROUGH_DIVIDE],
			firstUseOffset: FIRST_USE_OFFSET_DIVIDE, // but not by 0.
		},
	]
}
