import CoreSpeedmod from 'parser/core/modules/Speedmod'

import STATUSES from 'data/STATUSES'

export default class Speedmod extends CoreSpeedmod {
	constructor(...args) {
		super(...args)
		this.SPEED_BUFF_STATUS_IDS.push(
			STATUSES.BLOOD_WEAPON.id,
		)
	}
}
