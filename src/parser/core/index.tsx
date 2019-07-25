import {changelog} from './changelog'
import {Meta} from './Meta'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "core" */),
	changelog,
})
