import CoreParser from 'parser/core/Parser'

import Bahamut from './modules/Bahamut'
import DoTs from './modules/DoTs'
import DWT from './modules/DWT'
import Enkindle from './modules/Enkindle'
import Gauge from './modules/Gauge'
import Pets from './modules/Pets'
import Ruin2 from './modules/Ruin2'

class Parser extends CoreParser {
	static jobModules = {
		bahamut: Bahamut,
		dots: DoTs,
		dwt: DWT,
		enkindle: Enkindle,
		gauge: Gauge,
		pets: Pets,
		ruin2: Ruin2
	}
}

export default Parser
