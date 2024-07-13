import {Interrupts} from 'parser/core/modules/Interrupts'
import {Tincture} from 'parser/core/modules/Tincture'
import {AoEUsages} from './AoEUsages'
import {CooldownDowntime} from './CooldownDowntime'
import {Defensives} from './Defensives'
import {Gauge} from './Gauge'
import Procs from './Procs'
import {Swiftcast} from './Swiftcast'

export default [
	AoEUsages,
	CooldownDowntime,
	Defensives,
	Gauge,
	Interrupts,
	Procs,
	Swiftcast,
	Tincture,
]
