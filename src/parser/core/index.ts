import {ReactNode} from 'react'

import {Contributor, Role} from 'data/CONTRIBUTORS'
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
	modules: () => Promise<Array<typeof Module>>
	description?: ReactNode
	supportedPatches?: SupportedPatches
	contributors?: ContributorRole[]
	changelog?: ChangelogEntry[]
}

export default {
	modules: () => import('./modules' /* webpackChunkName: "core" */),
	changelog: [],
}
