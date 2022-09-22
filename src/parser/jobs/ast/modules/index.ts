import {Interrupts} from 'parser/core/modules/Interrupts'
import {ActionTimeline} from './ActionTimeline'
import {ArcanaSuggestions, ArcanaTracking} from './ArcanaTracking'
import ArcanaTrackingOptimized from './ArcanaTracking/ArcanaTrackingOptimized'
import {CritAndDHPredictor} from './ArcanaTracking/CritAndDHRates'
import {ArcanaUndrawUsage} from './ArcanaUndrawUsage'
import {CastTime} from './CastTime'
import {Combust} from './Combust'
import CrownPlay from './CrownPlay'
import {Divination} from './Divination'
import Draw from './Draw'
import {EarthlyStar} from './EarthlyStar'
import {Helios} from './Helios'
import {Lightspeed} from './Lightspeed'
import {LucidDreaming} from './LucidDreaming'
import {Macrocosmos} from './Macrocosmos'
import {oGCDs} from './oGCDs'
import {Overheal} from './Overheal'
import {StatusTimeline} from './StatusTimeline'
import {Synastry} from './Synastry'
import {Tincture} from './Tincture'

export default [
	ActionTimeline,
	ArcanaSuggestions,
	ArcanaTracking,
	ArcanaTrackingOptimized,
	ArcanaUndrawUsage,
	CastTime,
	CritAndDHPredictor,
	Combust,
	Divination,
	Draw,
	CrownPlay,
	EarthlyStar,
	oGCDs,
	Helios,
	Interrupts,
	Lightspeed,
	LucidDreaming,
	Macrocosmos,
	Overheal,
	StatusTimeline,
	Synastry,
	Tincture,
]
