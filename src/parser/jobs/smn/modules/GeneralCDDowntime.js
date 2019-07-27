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
		ACTIONS.EGI_ASSAULT_GARUDA.id,
		ACTIONS.EGI_ASSAULT_TITAN.id,
		ACTIONS.EGI_ASSAULT_IFRIT.id,
		ACTIONS.EGI_ASSAULT_II_GARUDA.id,
		ACTIONS.EGI_ASSAULT_II_TITAN.id,
		ACTIONS.EGI_ASSAULT_II_IFRIT.id,
		ACTIONS.ENKINDLE_GARUDA.id,
		ACTIONS.ENKINDLE_TITAN.id,
		ACTIONS.ENKINDLE_IFRIT.id,
	]
}
