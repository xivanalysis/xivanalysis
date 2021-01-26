import STATUSES from 'data/STATUSES'
import CoreSpeedmod from 'parser/core/modules/Speedmod'

export default class Speedmod extends CoreSpeedmod {
	constructor(...args) {
		super(...args)
		this.SPEED_BUFF_STATUS_IDS.push(
			STATUSES.SHIFU.id,
		)
	}
}
