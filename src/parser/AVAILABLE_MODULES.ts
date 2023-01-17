import {EncounterKey} from 'data/ENCOUNTERS'
import {JobKey} from 'data/JOBS'
import {CORE} from './core'
import {Meta} from './core/Meta'
import {ASTROLOGIAN} from './jobs/ast'
import {BLACK_MAGE} from './jobs/blm'
import {BLUE_MAGE} from './jobs/blu'
import {BARD} from './jobs/brd'
import {DANCER} from './jobs/dnc'
import {DRAGOON} from './jobs/drg'
import {DARK_KNIGHT} from './jobs/drk'
import {GUNBREAKER} from './jobs/gnb'
import {MACHINIST} from './jobs/mch'
import {MONK} from './jobs/mnk'
import {NINJA} from './jobs/nin'
import {PALADIN} from './jobs/pld'
import {RED_MAGE} from './jobs/rdm'
import {REAPER} from './jobs/rpr'
import {SAMURAI} from './jobs/sam'
import {SCHOLAR} from './jobs/sch'
import {SAGE} from './jobs/sge'
import {SUMMONER} from './jobs/smn'
import {WARRIOR} from './jobs/war'
import {WHITE_MAGE} from './jobs/whm'

interface AvailableModules {
	CORE: Meta
	JOBS: Partial<Record<JobKey, Meta>>
	BOSSES: Partial<Record<EncounterKey, Meta>>
}

export const AVAILABLE_MODULES: AvailableModules = {
	CORE,

	JOBS: {
		PALADIN,
		WARRIOR,
		DARK_KNIGHT,
		GUNBREAKER,

		WHITE_MAGE,
		SCHOLAR,
		ASTROLOGIAN,
		SAGE,

		MONK,
		DRAGOON,
		NINJA,
		SAMURAI,
		REAPER,

		BARD,
		MACHINIST,
		DANCER,

		BLACK_MAGE,
		SUMMONER,
		RED_MAGE,
		BLUE_MAGE,
	},

	BOSSES: {
		// BOSSKEY: importedBossMeta
	},
}
