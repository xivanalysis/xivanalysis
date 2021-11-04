import {Boss} from 'data/BOSSES'
import {JobKey} from 'data/JOBS'
import CORE from './core'
import {Meta} from './core/Meta'
import ASTROLOGIAN from './jobs/ast'
import BLACK_MAGE from './jobs/blm'
import BLUE_MAGE from './jobs/blu'
import BARD from './jobs/brd'
import DANCER from './jobs/dnc'
import DRAGOON from './jobs/drg'
import DARK_KNIGHT from './jobs/drk'
import GUNBREAKER from './jobs/gnb'
import MACHINIST from './jobs/mch'
import MONK from './jobs/mnk'
import NINJA from './jobs/nin'
import PALADIN from './jobs/pld'
import RED_MAGE from './jobs/rdm'
import SAMURAI from './jobs/sam'
import SCHOLAR from './jobs/sch'
import SUMMONER from './jobs/smn'
import WARRIOR from './jobs/war'
import WHITE_MAGE from './jobs/whm'

interface AvailableModules {
	CORE: Meta
	JOBS: Partial<Record<JobKey, Meta>>
	BOSSES: Partial<Record<Boss['logId'], Meta>>
}

const AVAILABLE_MODULES: AvailableModules = {
	CORE,

	JOBS: {
		PALADIN,
		WARRIOR,
		DARK_KNIGHT,
		GUNBREAKER,

		WHITE_MAGE,
		SCHOLAR,
		ASTROLOGIAN,

		MONK,
		DRAGOON,
		NINJA,
		SAMURAI,

		BARD,
		MACHINIST,
		DANCER,

		BLACK_MAGE,
		SUMMONER,
		RED_MAGE,
		BLUE_MAGE,
	},

	BOSSES: {
		// [BOSSES.BOSSKEY.logId]: importedBossMeta
	},
}

export default AVAILABLE_MODULES
