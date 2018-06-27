import About from './About'
import Aetherflow from './Aetherflow'
import Bahamut from './Bahamut'
import DoTs from './DoTs'
import DWT from './DWT'
import Gauge from './Gauge'
import Pets from './Pets'
import Rouse from './Rouse'
import Ruin2 from './Ruin2'
import Ruin4 from './Ruin4'

export default {
	// contributors?

	// TODO: This might belong in the about module in some manner
	patchCompatibility: '4.3',

	modules: {
		about: About,
		aetherflow: Aetherflow,
		bahamut: Bahamut,
		dots: DoTs,
		dwt: DWT,
		gauge: Gauge,
		pets: Pets,
		rouse: Rouse,
		ruin2: Ruin2,
		ruin4: Ruin4,
	},
}
