import ACTIONS from 'data/ACTIONS'
import CooldownDowntime from 'parser/core/modules/CooldownDowntime'

//The trance cooldowns are both 55s.  However, in order to maintain overall
//alignment with the 1 minute buff cycle, FBT should be held 10s per use
//(for a 55+65 = 120s cycle).  Due to the way cooldown tracking works in
//XIVA, both must have the same allowed downtime since they are in a cooldown group.
const TRANCE_ALLOWED_DOWNTIME = 10000

export default class GeneralCDDowntime extends CooldownDowntime {
	//Time that Jump deems ok for a OGCD to be down : ^)
	// eslint-disable-next-line no-magic-numbers
	allowedDowntime = 4000
	trackedCds = [
		ACTIONS.ENERGY_DRAIN.id,
		ACTIONS.ENERGY_SIPHON.id,
		ACTIONS.DREADWYRM_TRANCE.id,
		ACTIONS.FIREBIRD_TRANCE.id,
		ACTIONS.ASSAULT_I_AERIAL_SLASH.id,
		ACTIONS.ASSAULT_I_EARTHEN_ARMOR.id,
		ACTIONS.ASSAULT_I_CRIMSON_CYCLONE.id,
		ACTIONS.ASSAULT_II_SLIIPSTREAM.id,
		ACTIONS.ASSAULT_II_MOUNTAIN_BUSTER.id,
		ACTIONS.ASSAULT_II_FLAMING_CRUSH.id,
		ACTIONS.ENKINDLE_AERIAL_BLAST.id,
		ACTIONS.ENKINDLE_EARTHEN_FURY.id,
		ACTIONS.ENKINDLE_INFERNO.id,
		ACTIONS.SMN_AETHERPACT.id,
	]

	allowedDowntimePerOgcd = {
		[ACTIONS.DREADWYRM_TRANCE.id]: TRANCE_ALLOWED_DOWNTIME,
		[ACTIONS.FIREBIRD_TRANCE.id]: TRANCE_ALLOWED_DOWNTIME,
	}
}
