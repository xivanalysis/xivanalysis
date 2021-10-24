import {Interrupts} from 'parser/core/modules/Interrupts'
import {CastTime} from './CastTime'
import Gauge from './Gauge'
import Leylines from './Leylines'
import NotCasting from './NotCasting'
import OGCDDowntime from './OGCDDowntime'
import Procs from './Procs'
import {RotationWatchdog} from './RotationWatchdog'
import Sharpcast from './Sharpcast'
import Thunder from './Thunder'
import BlmWeaving from './Weaving'

export default [
	BlmWeaving,
	CastTime,
	Gauge,
	Interrupts,
	Leylines,
	NotCasting,
	OGCDDowntime,
	Procs,
	RotationWatchdog,
	Sharpcast,
	Thunder,
]
