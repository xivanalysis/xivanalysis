import {AlwaysBeCasting} from 'parser/core/modules/AlwaysBeCasting'
import {Tincture} from 'parser/core/modules/Tincture'
import {CastTime} from './CastTime'
import {Combos} from './Combos'
import {Defensives} from './Defensives'
import {DualCast} from './Dualcast'
import {Embolden} from './Embolden'
import {GeneralCDDowntime} from './GeneralCDDowntime'
import {Interrupts} from './Interrupts'
import {ManaGauge} from './ManaGauge'
import {ManaStackGauge} from './ManaStackGauge'
import {MeleeCombos} from './MeleeCombos'
import {Procs} from './Procs'
import {Swiftcast} from './Swiftcast'
import {Weaving} from './Weaving'

export {DualStatistic} from 'parser/jobs/rdm/statistics/DualStatistic'

export default [
	AlwaysBeCasting,
	Embolden,
	ManaGauge,
	ManaStackGauge,
	CastTime,
	Defensives,
	DualCast,
	GeneralCDDowntime,
	Interrupts,
	Procs,
	Combos,
	MeleeCombos,
	Tincture,
	Swiftcast,
	Weaving,
]
