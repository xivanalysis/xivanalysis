import {Meta} from 'parser/core/Meta'

export const urShiva = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "bosses-urShiva" */),
})
