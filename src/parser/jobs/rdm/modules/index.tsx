import {AlwaysBeCasting} from 'parser/core/modules/AlwaysBeCasting'
import {Tincture} from 'parser/core/modules/Tincture'
import {CastTime} from './CastTime'
import {Combos} from './Combos'
import {Defensives} from './Defensives'
import {DualCast} from './Dualcast'
import {Embolden} from './Embolden'
import {GeneralCDDowntime} from './GeneralCDDowntime'
import {Interrupts} from './Interrupts'
import {MagickedSwordplay} from './MagickedSwordplay'
import {Manafication} from './Manafication'
import {ManaGauge} from './ManaGauge'
import {ManaStackGauge} from './ManaStackGauge'
import {MeleeCombos} from './MeleeCombos'
import {Prefulgence} from './Prefulgence'
import {Procs} from './Procs'
import {Swiftcast} from './Swiftcast'
import {ViceOfThorns} from './ViceOfThorns'
import {Weaving} from './Weaving'
//For now commenting this out, it's uncertain if we want GrandImpact to be within Procs or on its own.
//For now it'll be contained within Procs
//import { GrandImpact } from './GrandImpact'

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
	//See Above comment on GrandImpact
	//GrandImpact,
	MagickedSwordplay,
	Manafication,
	Prefulgence,
	ViceOfThorns,
]
