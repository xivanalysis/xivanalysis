import {Meta} from 'parser/core/Meta'

export const neir3 = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "bosses-neir3" */),
})
