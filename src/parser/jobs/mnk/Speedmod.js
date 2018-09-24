import CoreSpeedmod from 'parser/core/modules/Speedmod'

import STATUSES from 'data/STATUSES'
import {JOB_SPEED_BUFF_TO_SPEEDMOD_MAP} from 'parser/core/modules/SpeedmodConsts'

const GREASED_LIGHTNING_STATUSES = [
	STATUSES.GREASED_LIGHTNING_I.id,
	STATUSES.GREASED_LIGHTNING_II.id,
	STATUSES.GREASED_LIGHTNING_III.id,
]

const ROF_SPEEDMOD = 1.15

export default class Speedmod extends CoreSpeedmod {
	// Force modules to run before Speedmod. ie: normalise to Greased Lightning events so Speedmod can pick them up natively
	static dependencies = [
		...CoreSpeedmod.dependencies,
		'greasedlightning', // eslint-disable-line xivanalysis/no-unused-dependencies
	]

	_isRofActive = false

	constructor(...args) {
		super(...args)
		this.SPEED_BUFF_STATUS_IDS.push(...GREASED_LIGHTNING_STATUSES)
	}

	jobSpecificNormaliseLogic(event) {
		const types = ['applybuff', 'removebuff', 'applybuffstack']

		if (!types.includes(event.type)) {
			return
		}

		switch (event.type) {
		case 'applybuff':
			if (event.ability.guid === STATUSES.RIDDLE_OF_FIRE.id) {
				this._isRofActive = true
			}
			break
		case 'removebuff':
			if (event.ability.guid === STATUSES.RIDDLE_OF_FIRE.id) {
				this._isRofActive = false
			}
			break
		case 'applybuffstack':
			if (event.ability.guid === STATUSES.GREASED_LIGHTNING_I.id) {
				// applybuffstack only shows for stacks 2 and 3 of GL
				// removebuffstack doesn't show for GL. This is handled by removebuff in parent
				this._activeSpeedMap = JOB_SPEED_BUFF_TO_SPEEDMOD_MAP[GREASED_LIGHTNING_STATUSES[event.stack - 1]]
			}
			break
		}
	}

	getJobAdditionalSpeedbuffScalar() {
		return this._isRofActive ? ROF_SPEEDMOD : 1
	}
}
