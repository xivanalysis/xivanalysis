import CoreParser from 'parser/core/Parser'

import Bahamut from './modules/Bahamut'
import DoTs from './modules/DoTs'
import Enkindle from './modules/Enkindle'
import Gauge from './modules/Gauge'
import Ruin2 from './modules/Ruin2'

class Parser extends CoreParser {
	static jobModules = {
		bahamut: Bahamut,
		dots: DoTs,
		enkindle: Enkindle,
		gauge: Gauge,
		ruin2: Ruin2
	}
}

export default Parser
