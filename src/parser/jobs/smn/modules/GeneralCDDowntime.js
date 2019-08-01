import ACTIONS from 'data/ACTIONS'
import CooldownDowntime from 'parser/core/modules/CooldownDowntime'

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
	]
}
