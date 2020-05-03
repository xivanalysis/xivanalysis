import {Meta} from 'parser/core/Meta'

export const tea = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "bosses-tea" */),
})
