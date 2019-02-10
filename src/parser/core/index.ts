import {ReactNode} from 'react'

import CONTRIBUTORS, {Contributor, Role} from 'data/CONTRIBUTORS'
import {PatchNumber} from 'data/PATCHES'
import Module from './Module'

export interface SupportedPatches {
	from: PatchNumber
	to: PatchNumber
}

interface ContributorRole {
	user: Contributor
	role: Role
}

interface ChangelogEntry {
	date: Date
	contributors: Contributor[]
	changes: ReactNode
}

export interface Meta {
	modules: () => Promise<{default: Array<typeof Module>}>
	description?: ReactNode
	supportedPatches?: SupportedPatches
	contributors?: ContributorRole[]
	changelog?: ChangelogEntry[]
}

export default {
	modules: () => import('./modules' /* webpackChunkName: "core" */),
	changelog: [{
		date: new Date('2018-11-22'),
		changes: 'Prevented hits that do zero damage from counting towards AoE hit counts.',
		contributors: [CONTRIBUTORS.ACKWELL],
	}],
}
