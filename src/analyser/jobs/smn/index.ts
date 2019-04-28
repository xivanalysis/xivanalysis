import {Meta} from 'analyser/Meta'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-smn"" */),
})
