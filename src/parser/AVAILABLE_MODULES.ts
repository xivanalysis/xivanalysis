import BOSSES, {Boss} from 'data/BOSSES'
import {JobKey} from 'data/JOBS'
import {e121} from './bosses/e12_1'
import {e122} from './bosses/e12_2'
import {e6} from './bosses/e6'
import {exVaris} from './bosses/exVaris'
import {neir11} from './bosses/nier11'
import {neir4} from './bosses/nier4'
import {tea} from './bosses/tea'
import {urLeviathan} from './bosses/urLeviathan'
import {urShiva} from './bosses/urShiva'
import {urTitan} from './bosses/urTitan'
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
		[BOSSES.NIER4.logId]: neir4,
		[BOSSES.NIER11.logId]: neir11,

		[BOSSES.VARIS_YAE_GALVUS.logId]: exVaris,

		[BOSSES.UNREAL_SHIVA.logId]: urShiva,
		[BOSSES.UNREAL_TITAN.logId]: urTitan,
		[BOSSES.UNREAL_LEVIATHAN.logId]: urLeviathan,

		[BOSSES.E6.logId]: e6,
		[BOSSES.E12_1.logId]: e121,
		[BOSSES.E12_2.logId]: e122,

		[BOSSES.TEA.logId]: tea,
	},
}

export default AVAILABLE_MODULES
