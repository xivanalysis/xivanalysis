import BOSSES from 'data/BOSSES'
import JOBS from 'data/JOBS'

export default {
	CORE: () => import('./core/modules' /* webpackChunkName: "core" */),

	JOBS: {
		[JOBS.NINJA.logType]: () => import('./jobs/nin' /* webpackChunkName: "jobs-nin" */),
		[JOBS.SUMMONER.logType]: () => import('./jobs/smn' /* webpackChunkName: "jobs-smn" */),
		[JOBS.BLACK_MAGE.logType]: () => import('./jobs/blm' /* webpackChunkName: "jobs-blm" */),
		[JOBS.RED_MAGE.logType]: () => import('./jobs/rdm' /* webpackChunkName: "jobs-rdm" */),
		[JOBS.WARRIOR.logType]: () => import('./jobs/war' /* webpackChunkName: "jobs-war" */),
		[JOBS.WHITE_MAGE.logType]: () => import('./jobs/whm' /* webpackChunkName: "jobs-whm" */),
		[JOBS.PALADIN.logType]: () => import('./jobs/pld' /* webpackChunkName: "jobs-pld" */),
		[JOBS.SCHOLAR.logType]: () => import('./jobs/sch' /* webpackChunkName: "jobs-sch" */),
		[JOBS.BARD.logType]: () => import('./jobs/brd' /* webpackChunkName: "jobs-brd" */),
		[JOBS.SAMURAI.logType]: () => import('./jobs/sam' /*webpackChunkName: "jobs-sam" */),
	},

	BOSSES: {
		[BOSSES.BAHAMUT_PRIME.logId]: () => import('./bosses/bahamutPrime' /* webpackChunkName: "bosses-bahamutPrime" */),
		[BOSSES.DEMON_CHADARNOOK.logId]: () => import('./bosses/chadarnook' /* webpackChunkName: "bosses-chadarnook" */),
	},
}
