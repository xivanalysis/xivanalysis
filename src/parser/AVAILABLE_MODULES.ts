import BOSSES, {Boss} from 'data/BOSSES'
import JOBS, {Job} from 'data/JOBS'

import CORE from './core'
import {Meta} from './core/Meta'

import AST from './jobs/ast'
import BLM from './jobs/blm'
import BLU from './jobs/blu'
import BRD from './jobs/brd'
import DNC from './jobs/dnc'
import DRG from './jobs/drg'
import DRK from './jobs/drk'
import GNB from './jobs/gnb'
import MCH from './jobs/mch'
import MNK from './jobs/mnk'
import NIN from './jobs/nin'
import PLD from './jobs/pld'
import RDM from './jobs/rdm'
import SAM from './jobs/sam'
import SCH from './jobs/sch'
import SMN from './jobs/smn'
import WAR from './jobs/war'
import WHM from './jobs/whm'

import {exTitania} from './bosses/exTitania'
import {exInnocence} from './bosses/exInnocence'
import {exHades} from './bosses/exHades'
import {exRuby1} from './bosses/exRuby1'
import {exRuby2} from './bosses/exRuby2'
import {exVaris} from './bosses/exVaris'
import {e4} from './bosses/e4'
import {e7} from './bosses/e7'
import {e8} from './bosses/e8'

interface AvailableModules {
	CORE: Meta
	JOBS: Partial<Record<Job['logType'], Meta>>
	BOSSES: Partial<Record<Boss['logId'], Meta>>
}

export default {
	CORE,

	JOBS: {
		[JOBS.PALADIN.logType]: PLD,
		[JOBS.WARRIOR.logType]: WAR,
		[JOBS.DARK_KNIGHT.logType]: DRK,
		[JOBS.GUNBREAKER.logType]: GNB,

		[JOBS.WHITE_MAGE.logType]: WHM,
		[JOBS.SCHOLAR.logType]: SCH,
		[JOBS.ASTROLOGIAN.logType]: AST,

		[JOBS.MONK.logType]: MNK,
		[JOBS.DRAGOON.logType]: DRG,
		[JOBS.NINJA.logType]: NIN,
		[JOBS.SAMURAI.logType]: SAM,

		[JOBS.BARD.logType]: BRD,
		[JOBS.MACHINIST.logType]: MCH,
		[JOBS.DANCER.logType]: DNC,

		[JOBS.BLACK_MAGE.logType]: BLM,
		[JOBS.SUMMONER.logType]: SMN,
		[JOBS.RED_MAGE.logType]: RDM,
		[JOBS.BLUE_MAGE.logType]: BLU,
	},

	BOSSES: {
		[BOSSES.TITANIA.logId]: exTitania,
		[BOSSES.INNOCENCE.logId]: exInnocence,
		[BOSSES.HADES.logId]: exHades,
		[BOSSES.RUBY_WEAPON_1.logId]: exRuby1,
		[BOSSES.RUBY_WEAPON_2.logId]: exRuby2,
		[BOSSES.VARIS_YAE_GALVUS.logId]: exVaris,

		[BOSSES.E4.logId]: e4,
		[BOSSES.E7.logId]: e7,
		[BOSSES.E8.logId]: e8,
	},
} as AvailableModules
