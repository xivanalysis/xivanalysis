import CoreCooldowns from 'parser/core/modules/Cooldowns'
import ACTIONS from 'data/ACTIONS'

export default class Cooldowns extends CoreCooldowns {
	static cooldownOrder = [
		ACTIONS.AETHERFLOW.id,
		ACTIONS.FESTER.id,
		ACTIONS.PAINFLARE.id,
		ACTIONS.ENERGY_DRAIN.id,
		ACTIONS.BANE.id,
		ACTIONS.DREADWYRM_TRANCE.id,
		ACTIONS.DEATHFLARE.id,
		ACTIONS.SUMMON_BAHAMUT.id,
		ACTIONS.ENKINDLE_BAHAMUT.id,
		ACTIONS.ROUSE.id,
		ACTIONS.ENKINDLE.id,
	]
}
