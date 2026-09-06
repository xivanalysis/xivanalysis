//import {Trans} from '@lingui/react/macro'
//import {DataLink} from 'components/ui/DbLink'
//import {CONTRIBUTORS, ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import {changelog} from './changelog'

export const BEASTMASTER = new Meta({
	modules: () => import('./modules' /* webpackChunkName: "jobs-bst" */),

	Description: () => <>
	</>,

	supportedPatches: {
		from: '✖',
		to: '✖',
	},

	contributors: [
		// {user: CONTRIBUTORS.YOU, role: ROLES.YOUR_ROLE},
	],

	changelog,
})
