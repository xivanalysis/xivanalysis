import {SEVERITY} from 'parser/core/modules/Suggestions'
import {SwiftcastModule} from 'parser/core/modules/Swiftcast'

const MISSED_SEVERITIES = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

export default class Swiftcast extends SwiftcastModule {
	severityTiers = MISSED_SEVERITIES
}
