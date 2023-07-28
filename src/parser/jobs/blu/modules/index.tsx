import {LucidDreaming} from 'parser/core/modules/LucidDreaming'
import {Tincture} from 'parser/core/modules/Tincture'
import {ActionTimeline} from './ActionTimeline'
import {AlwaysBeCasting} from './AlwaysBeCasting'
import {BLURaidBuffs} from './BLURaidBuffs'
import {ColdFog} from './ColdFog'
import {BLUDeath} from './Death'
import {Defensives} from './Defensives'
import {DoTs} from './DoTs'
import {DroppedBuffs} from './DroppedBuffs'
import {GeneralCDDowntime} from './GeneralCDDowntime'
import {Interrupts} from './Interrupts'
import {MightyGuardGCDing} from './MightyGuardGCDing'
import {MoonFlute} from './MoonFlute'
import {BLUOverheal} from './Overheal'
import {RevengeBlast} from './RevengeBlast'
import {StatusTimeline} from './StatusTimeline'
import {Swiftcast} from './Swiftcast'
import {TripleTrident} from './TripleTrident'
import {BLUWeaving} from './Weaving'
import {WingedReprobation} from './WingedReprobation'

export default [
	MightyGuardGCDing,
	Defensives,
	ActionTimeline,
	BLUDeath,
	BLUWeaving,
	AlwaysBeCasting,
	DoTs,
	Tincture,
	Interrupts,
	LucidDreaming,
	Swiftcast,
	GeneralCDDowntime,
	MoonFlute,
	ColdFog,
	RevengeBlast,
	BLURaidBuffs,
	BLUOverheal,
	StatusTimeline,
	TripleTrident,
	DroppedBuffs,
	WingedReprobation,
]
