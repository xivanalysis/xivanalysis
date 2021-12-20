import {Interrupts} from 'parser/core/modules/Interrupts'
import {PetTimeline} from 'parser/core/modules/PetTimeline'
import {Tincture} from 'parser/core/modules/Tincture'
import {Weaving} from 'parser/core/modules/Weaving'
import {ActionTimeline} from './ActionTimeline'
import GeneralCDDowntime from './GeneralCDDowntime'
import {AoeChecker} from './MultiHitSkills'
import {Physick} from './Physick'

export default [
	ActionTimeline,
	GeneralCDDowntime,
	Interrupts,
	AoeChecker,
	PetTimeline,
	Physick,
	Tincture,
	Weaving,
]
