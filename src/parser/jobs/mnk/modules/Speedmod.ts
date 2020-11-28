import {dependency} from 'parser/core/Module'
import CoreSpeedmod from 'parser/core/modules/Speedmod'

import Gauge from './Gauge'

const SPEED_INCREASE_PER_STACK = 5
const SPEED_INCREASE_TRAITED_GL = 80

export default class Speedmod extends CoreSpeedmod {
	@dependency private gauge!: Gauge

	getJobAdditionalSpeedbuffScalar(event: TODO) {
		if (this.parser.patch.before('5.4')) {
			return (100 - (this.gauge.getStacksAt(event.timestamp) * SPEED_INCREASE_PER_STACK)) / 100
		}

		return SPEED_INCREASE_TRAITED_GL
	}
}
