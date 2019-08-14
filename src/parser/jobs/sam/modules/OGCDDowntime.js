import ACTIONS from 'data/ACTIONS'
import CooldownDowntime from 'parser/core/modules/CooldownDowntime'

export default class OGCDDowntime extends CooldownDowntime {
	//Time that samurais have deemed ok for a OGCD to be down
	// eslint-disable-next-line no-magic-numbers
	allowedDowntime = 5000
	trackedCds = [
		ACTIONS.MEIKYO_SHISUI.id,
		ACTIONS.KAESHI_SETSUGEKKA.id,
		ACTIONS.KAESHI_GOKEN.id,
		ACTIONS.KAESHI_HIGANBANA.id,
	]
}
