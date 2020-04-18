import {Meta} from 'parser/core/Meta'

export const exVaris = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "bosses-exVaris" */),
})
