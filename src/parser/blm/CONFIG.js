import JOBS from 'data/JOBS'

export default {
	// contributors?
	patchCompatibility: '4.3',

	job: JOBS.BLACK_MAGE,
	parser: () => import('./Parser' /* webpackChunkName: "BLM" */).then(exports => exports.default)
}
