import ACTIONS from 'data/ACTIONS'
import CooldownDowntime from 'parser/core/modules/CooldownDowntime'

//tracking the important™ CDs
const TRACKED_COOLDOWNS = [
	ACTIONS.FLECHE.id,
	ACTIONS.CONTRE_SIXTE.id,
	ACTIONS.ACCELERATION.id,
	ACTIONS.CORPS_A_CORPS.id,
	ACTIONS.DISPLACEMENT.id,
]

//Time that Jump deems ok for a OGCD to be down : ^)
const DOWNTIME_OK_TIME = 4000

export default class GeneralCDDowntime extends CooldownDowntime {

	constructor(...args) {
		super(...args)
		super.trackedcds = TRACKED_COOLDOWNS
		super.downtimeOkTime = DOWNTIME_OK_TIME
	}
}
