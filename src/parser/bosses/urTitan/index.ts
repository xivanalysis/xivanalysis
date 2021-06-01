import {Meta} from 'parser/core/Meta'

export const urTitan = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "bosses-urTitan" */),
})
