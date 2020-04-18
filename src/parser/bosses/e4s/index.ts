import {Meta} from 'parser/core/Meta'

export const e4s = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "bosses-e4s" */),
})
