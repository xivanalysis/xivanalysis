import {Meta} from 'analyser/Meta'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-smn" */),

	supportedPatches: {
		from: '4.2',
		to: '4.5',
	},
})
