import {Interrupts} from 'parser/core/modules/Interrupts'
import {PetTimeline} from 'parser/core/modules/PetTimeline'
import {Tincture} from 'parser/core/modules/Tincture'
import {Weaving} from 'parser/core/modules/Weaving'
import {ActionTimeline} from './ActionTimeline'
import {Aetherflow} from './Aetherflow'
import GeneralCDDowntime from './GeneralCDDowntime'
import {AoeChecker} from './MultiHitSkills'
import {Physick} from './Physick'
import {RadiantAegis} from './RadiantAegis'
import {SearingLight} from './SearingLight'
import {Slipstream} from './Slipstream'
import {Summons} from './Summons'
import {Swiftcast} from './Swiftcast'

export default [
	ActionTimeline,
	Aetherflow,
	GeneralCDDowntime,
	Interrupts,
	AoeChecker,
	PetTimeline,
	Physick,
	RadiantAegis,
	SearingLight,
	Slipstream,
	Summons,
	Swiftcast,
	Tincture,
	Weaving,
]
