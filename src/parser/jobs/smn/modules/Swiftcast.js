import {SEVERITY} from 'parser/core/modules/Suggestions'
import {SwiftcastModule} from 'parser/core/modules/Swiftcast'
import {DWT_CAST_TIME_MOD} from './DWT'
import {dependency} from 'parser/core/Module'

const MISSED_SEVERITIES = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

export default class Swiftcast extends SwiftcastModule {
	static handle = 'swiftcast'

	@dependency dwt

	severityTiers = MISSED_SEVERITIES

	considerSwiftAction(event) {
		if (this.dwt.activeAt(this.parser.currentTimestamp) && event.castTime + DWT_CAST_TIME_MOD <= 0) {
			return false
		}
		return true
	}
}
