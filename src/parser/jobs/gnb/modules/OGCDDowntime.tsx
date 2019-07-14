import ACTIONS from 'data/ACTIONS'
import CooldownDowntime from 'parser/core/modules/CooldownDowntime'

export default class AbilityDowntime extends CooldownDowntime {
	allowedDowntime = 2500
	trackedCds = [
		ACTIONS.BLASTING_ZONE.id, // Only track this one for now, assume level 80
		ACTIONS.ROUGH_DIVIDE.id,
		ACTIONS.BOW_SHOCK.id,
	]
}
