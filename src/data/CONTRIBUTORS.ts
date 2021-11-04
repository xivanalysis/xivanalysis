import {MessageDescriptor} from '@lingui/core'
import {t} from '@lingui/macro'
import {Job} from './JOBS'

export interface Contributor {
	name: string
	avatar?: string
	jobs: Job[]
}

const CONTRIBUTORS = {
	// KEY: {
	// 	name: 'Your Name',
	// 	avatar: require('./avatar/filename.jpg'),
	// 	jobs: [
	// 		JOBS.SOME_JOB,
	// 	],
	// },
}
export default CONTRIBUTORS as Record<keyof typeof CONTRIBUTORS, Contributor>

export interface Role {
	text: MessageDescriptor
}

const roleData = {
	MAINTAINER: {
		text: t('core.role.maintainer')`Maintainer`,
	},
	THEORYCRAFT: {
		text: t('core.role.theorycraft')`Theorycraft`,
	},
	DEVELOPER: {
		text: t('core.role.developer')`Developer`,
	},
}

export const ROLES = roleData as Record<keyof typeof roleData, Role>
