import {Interrupts} from 'parser/core/modules/Interrupts'
import BLMProcs from './BLMProcs'
import Gauge from './Gauge'
import Leylines from './Leylines'
import NotCasting from './NotCasting'
import OGCDDowntime from './OGCDDowntime'
import RotationWatchdog from './RotationWatchdog'
import Sharpcast from './Sharpcast'
import Speedmod from './Speedmod'
import Thunder from './Thunder'
import BlmWeaving from './Weaving'

export default [
	BlmWeaving,
	BLMProcs,
	Gauge,
	Interrupts,
	Leylines,
	NotCasting,
	OGCDDowntime,
	RotationWatchdog,
	Sharpcast,
	Speedmod,
	Thunder,
]
