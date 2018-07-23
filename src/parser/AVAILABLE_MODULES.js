import BOSSES from 'data/BOSSES'
import JOBS from 'data/JOBS'

export default {
	CORE: () => import('./core/modules' /* webpackChunkName: "core" */),

	JOBS: {
		[JOBS.SUMMONER.logType]: () => import('./jobs/smn' /* webpackChunkName: "jobs-smn" */),
		[JOBS.BLACK_MAGE.logType]: () => import('./jobs/blm' /* webpackChunkName: "jobs-blm" */),
		[JOBS.RED_MAGE.logType]: () => import('./jobs/rdm' /* webpackChunkName: "jobs-rdm" */),
		[JOBS.WARRIOR.logType]: () => import('./jobs/war' /* webpackChunkName: "jobs-war" */),
	},

	BOSSES: {
		[BOSSES.BAHAMUT_PRIME.logId]: () => import('./bosses/bahamutPrime' /* webpackChunkName: "bosses-bahamutPrime" */),
		[BOSSES.DEMON_CHADARNOOK.logId]: () => import('./bosses/chadarnook' /* webpackChunkName: "bosses-chadarnook" */),
	},
}
