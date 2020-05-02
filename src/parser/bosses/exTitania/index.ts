import {Meta} from 'parser/core/Meta'

export const exTitania = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "bosses-exTitania" */),
})
