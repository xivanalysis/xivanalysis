import {Interrupts} from 'parser/core/modules/Interrupts'
import {Tincture} from 'parser/core/modules/Tincture'
import {ActionTimeline} from './ActionTimeline'
import Demis from './Demis'
import Devotion from './Devotion'
import DoTs from './DoTs'
import DWT from './DWT'
import EgiCommands from './EgiCommands'
import Gauge from './Gauge'
import GeneralCDDowntime from './GeneralCDDowntime'
import MissingDoTs from './MissingDoTs'
import {AoeChecker} from './MultiHitSkills'
import Pets from './Pets'
import {PetTimeline} from './PetTimeline'
import Physick from './Physick'
import Ruin2 from './Ruin2'
import Swiftcast from './Swiftcast'
import TriDisaster from './TriDisaster'
import {Weaving} from './Weaving'

export default [
	ActionTimeline,
	Demis,
	Devotion,
	DoTs,
	DWT,
	EgiCommands,
	Gauge,
	GeneralCDDowntime,
	Interrupts,
	MissingDoTs,
	AoeChecker,
	Pets,
	PetTimeline,
	Physick,
	Ruin2,
	Swiftcast,
	Tincture,
	TriDisaster,
	Weaving,
]
