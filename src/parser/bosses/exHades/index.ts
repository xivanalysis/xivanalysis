import {Meta} from 'parser/core/Meta'

export const exHades = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "bosses-exHades" */),
})
