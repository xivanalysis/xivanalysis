import ACTIONS from 'data/ACTIONS'
import CooldownDowntime from 'parser/core/modules/CooldownDowntime'

export default class OGCDDowntime extends CooldownDowntime {
	// eslint-disable-next-line no-magic-numbers
	allowedDowntime = 2500
	trackedCds = [
		ACTIONS.BLOOD_WEAPON.id,
		ACTIONS.DELIRIUM.id,
		ACTIONS.PLUNGE.id,
		ACTIONS.SALTED_EARTH.id,
		ACTIONS.CARVE_AND_SPIT.id,
		ACTIONS.ABYSSAL_DRAIN.id,
		ACTIONS.LIVING_SHADOW.id,
	]
}
