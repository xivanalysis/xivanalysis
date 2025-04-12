import {Meta} from 'parser/core/Meta'

export const FRU = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "bosses-fru" */),
})
