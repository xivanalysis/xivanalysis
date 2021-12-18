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
	AKAIRYU: {
		name: 'Akairyu',
		avatar: require('./avatar/Akairyu.png'),
		jobs: [
			JOBS.BLACK_MAGE, JOBS.DANCER,
		],
	},
	AZARIAH: {
		name: 'Azariah',
		avatar: require('./avatar/azariah.png'),
		jobs: [
			JOBS.DARK_KNIGHT,
		],
	},
	FALINDRITH: {
		name: 'Falindrith',
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
	HINT: {
		name: 'Hint',
		avatar: require('./avatar/Hint.png'),
		jobs: [
			JOBS.MACHINIST, JOBS.BARD,
		],
	},
	OTOCEPHALY: {
		name: 'Otocephaly',
		avatar: require('./avatar/Otocephaly.png'),
		jobs: [
			JOBS.ASTROLOGIAN,
			JOBS.WHITE_MAGE,
		],
	},
	RYAN: {
		name: 'Ryan',
		avatar: require('./avatar/Rjb99.png'),
		jobs: [
			JOBS.GUNBREAKER,
			JOBS.SAMURAI,
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
