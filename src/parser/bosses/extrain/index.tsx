import {Meta} from 'parser/core/Meta'

export const EX_TRAIN = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "bosses-ex-train" */),
})
