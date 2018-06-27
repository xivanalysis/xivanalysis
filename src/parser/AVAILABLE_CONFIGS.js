import JOBS from 'data/JOBS'

// Pulling this handling out to reduce repetition below
function importConfig(folder) {
	return () => import(
		/* webpackChunkName: "[request]" */
		`./${folder}`
	).then(exports => exports.default)
}

export default {
	JOBS: {
		[JOBS.SUMMONER.logType]: importConfig('jobs/smn'),
	},

	BOSSES: {
	},
}
