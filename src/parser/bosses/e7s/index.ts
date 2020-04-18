import {Meta} from 'parser/core/Meta'

export const e7s = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "bosses-e7s" */),
})
