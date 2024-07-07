import {MessageDescriptor} from '@lingui/core'
import {t} from '@lingui/macro'
import {ensureRecord} from 'utilities'
import {Job, JOBS} from './JOBS'

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
	HINT: {
		name: 'Hint',
		avatar: require('./avatar/hint.jpg'),
		jobs: [
			JOBS.MACHINIST,
		],
	},
	AKAIRYU: {
		name: 'Akairyu',
		avatar: require('./avatar/Akairyu.png'),
		jobs: [
			JOBS.BLACK_MAGE, JOBS.DANCER, JOBS.SAGE, JOBS.PICTOMANCER,
		],
	},
	AZARIAH: {
		name: 'AzariahAeroborn',
		avatar: require('./avatar/azariah.png'),
		jobs: [
			JOBS.DARK_KNIGHT,
		],
	},
	FALINDRITH: {
		name: 'falindrith',
		avatar: require('./avatar/falindrith.png'),
		jobs: [
			JOBS.DRAGOON,
		],
	},
	TOASTDEIB: {
		name: 'Toastdeib',
		avatar: require('./avatar/toastdeib.png'),
		jobs: [
			JOBS.NINJA,
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
