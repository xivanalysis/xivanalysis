import JOBS from 'data/JOBS'

// Pulling this handling out to reduce repetition below
function importJobConfig(jobFolder) {
	return () => import(
		/* webpackChunkName: "[request]" */
		`./${jobFolder}/CONFIG.js`
	).then(exports => exports.default)
}

export default {
	JOBS: {
		[JOBS.SUMMONER.logType]: importJobConfig('jobs/smn'),
	},
}
