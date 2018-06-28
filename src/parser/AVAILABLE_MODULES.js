import JOBS from 'data/JOBS'

export default {
	JOBS: {
		[JOBS.SUMMONER.logType]: () => import('./jobs/smn' /* webpackChunkName: "jobs-smn" */),
	},

	BOSSES: {
	},
}
