import {dependency} from 'parser/core/Module'
import CoreSpeedmod from 'parser/core/modules/Speedmod'

import Gauge from './Gauge'

const SPEED_INCREASE_PER_STACK = 5

export default class Speedmod extends CoreSpeedmod {
	@dependency private gauge!: Gauge

	protected init(): void {
		super.init()
	}

	getJobAdditionalSpeedbuffScalar(event: TODO) {
		return (100 - (this.gauge.getStacksAt(event.timestamp) * SPEED_INCREASE_PER_STACK)) / 100
	}
}
