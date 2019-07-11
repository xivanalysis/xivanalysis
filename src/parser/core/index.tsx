import {Meta} from './Meta'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "core" */),
	changelog: [
	],
})
