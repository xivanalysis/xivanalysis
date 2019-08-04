import ACTIONS from 'data/ACTIONS'
import CooldownDowntime from 'parser/core/modules/CooldownDowntime'

export default class OGCDDowntime extends CooldownDowntime {
	allowedDowntime = 2500
	trackedCds = [
		ACTIONS.TECHNICAL_STEP.id,
		ACTIONS.STANDARD_STEP.id,
		ACTIONS.DEVILMENT.id,
		ACTIONS.FLOURISH.id,
	]
}
