import BOSSES from 'data/BOSSES'
import JOBS from 'data/JOBS'

import CORE from './core'
import MNK from './jobs/mnk'
import NIN from './jobs/nin'
import SMN from './jobs/smn'
import WAR from './jobs/war'
import MCH from './jobs/mch'
import DRG from './jobs/drg'
import RDM from './jobs/rdm'
import AST from './jobs/ast'
import BLM from './jobs/blm'
import BRD from './jobs/brd'
import DRK from './jobs/drk'
import PLD from './jobs/pld'
import SAM from './jobs/sam'
import SCH from './jobs/sch'
import WHM from './jobs/whm'

import DEMON_CHADARNOOK from './bosses/chadarnook'

export default {
	CORE,

	JOBS: {
		[JOBS.MONK.logType]: MNK,
		[JOBS.NINJA.logType]: NIN,
		[JOBS.SUMMONER.logType]: SMN,
		[JOBS.BLACK_MAGE.logType]: BLM,
		[JOBS.RED_MAGE.logType]: RDM,
		[JOBS.WARRIOR.logType]: WAR,
		[JOBS.WHITE_MAGE.logType]: WHM,
		[JOBS.PALADIN.logType]: PLD,
		[JOBS.SCHOLAR.logType]: SCH,
		[JOBS.BARD.logType]: BRD,
		[JOBS.SAMURAI.logType]: SAM,
		[JOBS.ASTROLOGIAN.logType]: AST,
		[JOBS.DARK_KNIGHT.logType]: DRK,
		[JOBS.MACHINIST.logType]: MCH,
		[JOBS.DRAGOON.logType]: DRG,
	},

	BOSSES: {
		[BOSSES.BAHAMUT_PRIME.logId]: () => import('./bosses/bahamutPrime' /* webpackChunkName: "bosses-bahamutPrime" */),
		[BOSSES.DEMON_CHADARNOOK.logId]: DEMON_CHADARNOOK,
	},
}
