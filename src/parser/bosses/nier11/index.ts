import {Meta} from 'parser/core/Meta'

export const neir11 = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "bosses-neir11" */),
})
