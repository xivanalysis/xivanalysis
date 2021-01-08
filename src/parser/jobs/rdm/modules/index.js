import {Tincture} from 'parser/core/modules/Tincture'
import Combos from './Combos'
import Dualcast from './Dualcast'
import Gauge from './Gauge'
import GeneralCDDowntime from './GeneralCDDowntime'
import MeleeCombos from './MeleeCombos'
import MovementSkills from './MovementSkills'
import Procs from './Procs'

export {DualStatistic} from 'parser/jobs/rdm/statistics/DualStatistic'

export default [
	Gauge,
	Dualcast,
	GeneralCDDowntime,
	Procs,
	Combos,
	MeleeCombos,
	MovementSkills,
	Tincture,
]
