import JOBS from 'data/JOBS'

export default {
	// contributors?
	patchCompatibility: '4.3',

	job: JOBS.SUMMONER,
	parser: () => import('./Parser' /* webpackChunkName: "SMN" */).then(exports => exports.default),
}
