import CoreParser from '@/parser/core/Parser'

import Ruin2 from './modules/Ruin2'

class Parser extends CoreParser {
	static jobModules = {
		ruin2: Ruin2
	}
}

export default Parser
