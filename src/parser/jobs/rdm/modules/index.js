import {AlwaysBeCasting} from 'parser/core/modules/AlwaysBeCasting'
import {Tincture} from 'parser/core/modules/Tincture'
import Combos from './Combos'
import {DualCast} from './Dualcast'
import {EngagementDisplacementTracking} from './EngagementDisplacementTracking'
import Gauge from './Gauge'
import GeneralCDDowntime from './GeneralCDDowntime'
import {Interrupts} from './Interrupts'
import MeleeCombos from './MeleeCombos'
import MovementSkills from './MovementSkills'
import Procs from './Procs'

export {DualStatistic} from 'parser/jobs/rdm/statistics/DualStatistic'

export default [
	AlwaysBeCasting,
	Gauge,
	DualCast,
	EngagementDisplacementTracking,
	GeneralCDDowntime,
	Interrupts,
	Procs,
	Combos,
	MeleeCombos,
	MovementSkills,
	Tincture,
]
