import ACTIONS from 'data/ACTIONS'
import CooldownDowntime from 'parser/core/modules/CooldownDowntime'

export default class OGCDDowntime extends CooldownDowntime {
	allowedDowntime = 2500
	trackedCds = [
		ACTIONS.SPIRITS_WITHIN.id,
		ACTIONS.CIRCLE_OF_SCORN.id,
	]
}
