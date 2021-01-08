import STATUSES from 'data/STATUSES'
import CoreSpeedmod from 'parser/core/modules/Speedmod'

export default class Speedmod extends CoreSpeedmod {
	/* NOTE: Use this to force modules to run before Speedmod. ie: normalise to generate Huton events so Speedmod can pick them up natively
	static dependencies = [
		...CoreSpeedmod.dependencies,
		'forms',
	]
	*/

	constructor(...args) {
		super(...args)
		this.SPEED_BUFF_STATUS_IDS.push(
			STATUSES.PRESENCE_OF_MIND.id,
		)
	}
}
