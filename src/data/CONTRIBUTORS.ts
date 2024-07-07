import {MessageDescriptor} from '@lingui/core'
import {t} from '@lingui/macro'
import {ensureRecord} from 'utilities'
import {JOBS, Job} from './JOBS'

export interface Contributor {
	name: string
	avatar?: string
	jobs: Job[]
}

const CONTRIBUTORS = ensureRecord<Contributor>()({
	// KEY: {
	// 	name: 'Your Name',
	// 	avatar: require('./avatar/filename.jpg'),
	// 	jobs: [
	// 		JOBS.SOME_JOB,
	// 	],
	// },
	LEYLIA: {
		name: 'Leylia',
		avatar: require('./avatar/Leylia.png'),
		jobs: [
			JOBS.RED_MAGE,
		],
	},
})

export default CONTRIBUTORS

export interface Role {
	text: MessageDescriptor
}

export const ROLES = ensureRecord<Role>()({
	MAINTAINER: {
		text: t('core.role.maintainer')`Maintainer`,
	},
	THEORYCRAFT: {
		text: t('core.role.theorycraft')`Theorycraft`,
	},
	DEVELOPER: {
		text: t('core.role.developer')`Developer`,
	},
})
