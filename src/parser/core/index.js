import CONTRIBUTORS from 'data/CONTRIBUTORS'

export default {
	modules: () => import('./modules' /* webpackChunkName: "core" */),
	changelog: [{
		date: new Date('2018-06-01'),
		changes: 'yes hi this is change',
		contributors: [CONTRIBUTORS.ACKWELL],
	}],
}
