import {Meta} from 'parser/core/Meta'

export const neir4 = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "bosses-neir4" */),
})
