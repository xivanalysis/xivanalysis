import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import {changelog} from './changelog'

const description = t('dnc.about.description')`
You can write the description for the job here. It supports a superset of
[markdown](https://commonmark.org/).
`

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-dnc" */),

	Description: () => <TransMarkdown source={description}/>,
	// supportedPatches: {
	// 	from: '✖',
	// 	to: '✖',
	// }
	contributors: [
		{user: CONTRIBUTORS.AKAIRYU, role: ROLES.DEVELOPER},
	],

	changelog,
})
