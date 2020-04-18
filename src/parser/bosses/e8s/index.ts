import {Meta} from 'parser/core/Meta'

export const e8s = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "bosses-e8s" */),
})
