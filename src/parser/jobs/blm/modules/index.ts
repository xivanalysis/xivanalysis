import {Tincture} from 'parser/core/modules/Tincture'
import {ActionTimeline} from './ActionTimeline'
import {AoEUsages} from './AoEUsages'
import {CastTime} from './CastTime'
import {Defensives} from './Defensives'
import {DoTs} from './DoTs'
import {Gauge} from './Gauge'
import {HotBlizzard3Info} from './HotBlizzard3Info'
import {Leylines} from './Leylines'
import {OGCDDowntime} from './OGCDDowntime'
import {Procs} from './Procs'
import {RotationWatchdog} from './RotationWatchdog'
import {Swiftcast} from './Swiftcast'
import {Thunder} from './Thunder'
import {Triplecast} from './Triplecast'
import {Utilities} from './Utilities'
import {Weaving} from './Weaving'

export const modules = [
	ActionTimeline,
	AoEUsages,
	Weaving,
	CastTime,
	Defensives,
	Gauge,
	HotBlizzard3Info,
	Tincture,
	Leylines,
	OGCDDowntime,
	Procs,
	RotationWatchdog,
	DoTs,
	Swiftcast,
	Thunder,
	Triplecast,
	Utilities,
]
