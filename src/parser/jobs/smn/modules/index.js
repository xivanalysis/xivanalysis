import {Interrupts} from 'parser/core/modules/Interrupts'
import {Tincture} from 'parser/core/modules/Tincture'
import {ActionTimeline} from './ActionTimeline'
import GeneralCDDowntime from './GeneralCDDowntime'
import {AoeChecker} from './MultiHitSkills'
import {PetTimeline} from './PetTimeline'
import {Physick} from './Physick'
import {Weaving} from './Weaving'

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
