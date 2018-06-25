import CoreParser from 'parser/core/Parser'

import About from './modules/About'
import Test from './modules/DoTs'
import Triple from './modules/Triple'
import Procs from './modules/Procs'
import BlmWeaving from './modules/BlmWeaving'

class Parser extends CoreParser {
	static jobModules = {
		about: About,
		dots: Test,
		triple: Triple,
		procs: Procs,
		weaving: BlmWeaving,
	}
}

export default Parser
