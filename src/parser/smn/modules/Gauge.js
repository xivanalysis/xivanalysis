import Module from '@/parser/core/Module'

import ACTIONS from '@/data/ACTIONS'

// Neither act nor fflogs track gauge very well, so let's do it ourselves
export default class Gauge extends Module {
	// -----
	// Properties
	// -----
	SUMMON_BAHAMUT_LENGTH = 20000

	lastSummonBahamut = -1

	// -----
	// API
	// -----
	bahamutSummoned() {
		const last = this.lastSummonBahamut
		return last > 0 && this.parser.currentTimestamp - last <= this.SUMMON_BAHAMUT_LENGTH
	}

	// -----
	// Event handling
	// -----
	on_cast(event) {
		const abilityId = event.ability.guid

		// Summon Bahamut
		if (abilityId === ACTIONS.SUMMON_BAHAMUT.id) {
			this.lastSummonBahamut = event.timestamp
		}
	}
}
