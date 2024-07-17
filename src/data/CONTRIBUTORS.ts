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
	KELOS: {
		name: 'Kelos',
		avatar: '',
		jobs: [
			JOBS.SUMMONER,
		],
	},
	RYAN: {
		name: 'Ryan',
		avatar: require('./avatar/Ryan.png'),
		jobs: [
			JOBS.GUNBREAKER,
			JOBS.VIPER,
			JOBS.SAMURAI,
		],
	},
	TOASTDEIB: {
		name: 'Toastdeib',
		avatar: require('./avatar/toastdeib.png'),
		jobs: [
			JOBS.NINJA,
		],
	},
	LEYLIA: {
		name: 'Leylia',
		avatar: require('./avatar/Leylia.png'),
		jobs: [
			JOBS.RED_MAGE,
		],
	},
	MERCWRI: {
		name: 'Mercwri',
		avatar: require('./avatar/mercwri.png'),
		jobs: [
			JOBS.SCHOLAR,
			JOBS.SAGE,
			JOBS.SUMMONER,
			JOBS.BLACK_MAGE,
		],
	},
	NONO: {
		name: 'Nono',
		avatar: require('./avatar/nono.png'),
		jobs: [
			JOBS.SCHOLAR,
		],
	},
	INNI: {
		name: 'Inni',
		avatar: require('./avatar/Inni.png'),
		jobs: [
			JOBS.WHITE_MAGE,
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
