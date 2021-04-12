import {Tincture} from 'parser/core/modules/Tincture'
import Combos from './Combos'
import Dualcast from './Dualcast'
import Gauge from './Gauge'
import GeneralCDDowntime from './GeneralCDDowntime'
import {Interrupts} from './Interrupts'
import MeleeCombos from './MeleeCombos'
import MovementSkills from './MovementSkills'
import RDMProcs from './RDMProcs'

export {DualStatistic} from 'parser/jobs/rdm/statistics/DualStatistic'

export default [
	Gauge,
	Dualcast,
	GeneralCDDowntime,
	Interrupts,
	RDMProcs,
	Combos,
	MeleeCombos,
	MovementSkills,
	Tincture,
]
