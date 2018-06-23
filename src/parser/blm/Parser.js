import CoreParser from 'parser/core/Parser'

import About from './modules/About'
import DoTs from './modules/DoTs'

class Parser extends CoreParser {
	static jobModules = {
		about: About,
		dots: DoTs,
	}
}

export default Parser
