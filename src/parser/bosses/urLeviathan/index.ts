import {Meta} from 'parser/core/Meta'

export const urLeviathan = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "bosses-urLeviathan" */),
})
