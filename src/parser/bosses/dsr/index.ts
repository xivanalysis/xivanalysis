import {Meta} from 'parser/core/Meta'

export const DSR = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "bosses-dsr" */),
})
