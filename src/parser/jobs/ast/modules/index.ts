import {Interrupts} from 'parser/core/modules/Interrupts'
import {ActionTimeline} from './ActionTimeline'
import {ArcanaSuggestions, ArcanaTracking} from './ArcanaTracking'
import {ArcanaUndrawUsage} from './ArcanaUndrawUsage'
import {Combust} from './Combust'
import {Divination} from './Divination'
import Draw from './Draw'
import {EarthlyStar} from './EarthlyStar'
import {Horoscope} from './Horoscope'
import {Lightspeed} from './Lightspeed'
import {LucidDreaming} from './LucidDreaming'
import {oGCDs_DPS} from './oGCDs_DPS'
import {oGCDs_HEALS} from './oGCDs_HEALS'
import {Overheal} from './Overheal'
import {StatusTimeline} from './StatusTimeline'
import {Synastry} from './Synastry'

export default [
	ActionTimeline,
	ArcanaSuggestions,
	ArcanaTracking,
	ArcanaUndrawUsage,
	Combust,
	Divination,
	Draw,
	EarthlyStar,
	oGCDs_DPS,
	oGCDs_HEALS,
	Horoscope,
	Interrupts,
	Lightspeed,
	LucidDreaming,
	Overheal,
	StatusTimeline,
	Synastry,
]
