import ACTIONS from 'data/ACTIONS'
import CooldownDowntime from 'parser/core/modules/CooldownDowntime'

export default class GeneralCDDowntime extends CooldownDowntime {
	//Time that Jump deems ok for a OGCD to be down : ^)
	// eslint-disable-next-line no-magic-numbers
	allowedDowntime = 4000
	trackedCds = [
		ACTIONS.FLECHE.id,
		ACTIONS.CONTRE_SIXTE.id,
		ACTIONS.ACCELERATION.id,
		ACTIONS.CORPS_A_CORPS.id,
		ACTIONS.DISPLACEMENT.id,
		ACTIONS.SWIFTCAST.id,
	]
}
