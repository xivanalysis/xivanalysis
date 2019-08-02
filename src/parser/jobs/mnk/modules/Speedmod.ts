import {dependency} from 'parser/core/Module'
import CoreSpeedmod from 'parser/core/modules/Speedmod'
import {JOB_SPEED_BUFF_TO_SPEEDMOD_MAP} from 'parser/core/modules/SpeedmodConsts'

import STATUSES from 'data/STATUSES'

import GreasedLightning from './GreasedLightning'

const GREASED_LIGHTNING_STATUSES: number[] = [
	STATUSES.GREASED_LIGHTNING.id,
	STATUSES.GREASED_LIGHTNING_II.id,
	STATUSES.GREASED_LIGHTNING_III.id,
	STATUSES.GREASED_LIGHTNING_IV.id,
]

export default class Speedmod extends CoreSpeedmod {
	// Force modules to run before Speedmod. ie: normalise to Greased Lightning events so Speedmod can pick them up natively
	@dependency private greasedlightning!: GreasedLightning

	protected init(): void {
		this.SPEED_BUFF_STATUS_IDS.push(...GREASED_LIGHTNING_STATUSES)
	}

	// TODO: use proper Event type once Speedmod is typed
	jobSpecificNormaliseLogic(event: TODO) {
		if (event.type !== 'applybuffstack') {
			return
		}

		if (event.ability.guid === STATUSES.GREASED_LIGHTNING.id) {
			// applybuffstack only shows for stacks 2/3/4 of GL
			// removebuffstack doesn't show for GL. This is handled by removebuff in parent
			this._activeSpeedMap = JOB_SPEED_BUFF_TO_SPEEDMOD_MAP[GREASED_LIGHTNING_STATUSES[event.stack - 1]]
		}
	}
}
