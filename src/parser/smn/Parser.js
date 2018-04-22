import CoreParser from '@/parser/core/Parser'

import Gauge from './modules/Gauge'
import Ruin2 from './modules/Ruin2'

class Parser extends CoreParser {
	static jobModules = {
		// Internal info tracking and so on
		gauge: Gauge,

		// Output stuff
		ruin2: Ruin2
	}
}

export default Parser
