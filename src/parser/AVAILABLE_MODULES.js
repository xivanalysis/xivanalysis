import BOSSES from 'data/BOSSES'
import JOBS from 'data/JOBS'

import CORE from './core'

import AST from './jobs/ast'
import BLM from './jobs/blm'
import BRD from './jobs/brd'
import DRG from './jobs/drg'
import DRK from './jobs/drk'
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

import BAHAMUT_PRIME from './bosses/bahamutPrime'
import DEMON_CHADARNOOK from './bosses/chadarnook'

export default {
	CORE,

	JOBS: {
		[JOBS.PALADIN.logType]: PLD,
		[JOBS.WARRIOR.logType]: WAR,
		[JOBS.DARK_KNIGHT.logType]: DRK,

		[JOBS.WHITE_MAGE.logType]: WHM,
		[JOBS.SCHOLAR.logType]: SCH,
		[JOBS.ASTROLOGIAN.logType]: AST,

		[JOBS.MONK.logType]: MNK,
		[JOBS.DRAGOON.logType]: DRG,
		[JOBS.NINJA.logType]: NIN,
		[JOBS.SAMURAI.logType]: SAM,

		[JOBS.BARD.logType]: BRD,
		[JOBS.MACHINIST.logType]: MCH,

		[JOBS.BLACK_MAGE.logType]: BLM,
		[JOBS.SUMMONER.logType]: SMN,
		[JOBS.RED_MAGE.logType]: RDM,
	},

	BOSSES: {
		[BOSSES.BAHAMUT_PRIME.logId]: BAHAMUT_PRIME,
		[BOSSES.DEMON_CHADARNOOK.logId]: DEMON_CHADARNOOK,
	},
}
