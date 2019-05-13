import {Meta} from 'parser/core/Meta'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "bosses-bahamutPrime" */),
})
