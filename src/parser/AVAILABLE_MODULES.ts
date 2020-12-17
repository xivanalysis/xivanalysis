import BOSSES, {Boss} from 'data/BOSSES'
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

import {neir3} from './bosses/nier3'
import {exTitania} from './bosses/exTitania'
import {exInnocence} from './bosses/exInnocence'
import {exHades} from './bosses/exHades'
import {exRuby1} from './bosses/exRuby1'
import {exRuby2} from './bosses/exRuby2'
import {exVaris} from './bosses/exVaris'
import {exEmerald1} from './bosses/exEmerald1'
import {exEmerald2} from './bosses/exEmerald2'
import {e4} from './bosses/e4'
import {e7} from './bosses/e7'
import {e8} from './bosses/e8'
import {e9} from './bosses/e9'
import {e121} from './bosses/e12_1'
import {tea} from './bosses/tea'

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
		[BOSSES.NIER3.logId]: neir3,

		[BOSSES.TITANIA.logId]: exTitania,
		[BOSSES.INNOCENCE.logId]: exInnocence,
		[BOSSES.HADES.logId]: exHades,
		[BOSSES.RUBY_WEAPON_1.logId]: exRuby1,
		[BOSSES.RUBY_WEAPON_2.logId]: exRuby2,
		[BOSSES.VARIS_YAE_GALVUS.logId]: exVaris,
		[BOSSES.EMERALD_WEAPON_1.logId]: exEmerald1,
		[BOSSES.EMERALD_WEAPON_2.logId]: exEmerald2,

		[BOSSES.E4.logId]: e4,
		[BOSSES.E7.logId]: e7,
		[BOSSES.E8.logId]: e8,
		[BOSSES.E9.logId]: e9,
		[BOSSES.E12_1.logId]: e121,

		[BOSSES.TEA.logId]: tea,
	},
}

export default AVAILABLE_MODULES
