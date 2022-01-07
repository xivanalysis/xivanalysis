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
	ACKWELL: {
		name: 'ackwell',
		avatar: 'https://secure.gravatar.com/avatar/383e78034167fdfe8303231a6dad33e5?s=100',
		jobs: [
			JOBS.SUMMONER,
			JOBS.RED_MAGE,
			JOBS.GUNBREAKER,
		],
	},
	AKAIRYU: {
		name: 'Akairyu',
		avatar: require('./avatar/Akairyu.png'),
		jobs: [
			JOBS.BLACK_MAGE,
			JOBS.DANCER,
			JOBS.SAGE,
		],
	},
	AY: {
		name: 'acchan',
		avatar: require('./avatar/ay.png'),
		jobs: [
			JOBS.MONK, JOBS.WARRIOR, JOBS.DARK_KNIGHT, JOBS.REAPER,
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
	KELOS: {
		name: 'Kelos',
		avatar: require('./avatar/kelos.png'),
		jobs: [
			JOBS.SUMMONER,
		],
	},
	HINT: {
		name: 'Hint',
		avatar: require('./avatar/Hint.png'),
		jobs: [
			JOBS.MACHINIST, JOBS.BARD,
		],
	},
	INNI: {
		name: 'Inni',
		avatar: require('./avatar/Inni.png'),
		jobs: [
			JOBS.WHITE_MAGE,
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

	LEYLIA: {
		name: 'Leylia',
		avatar: require('./avatar/Leylia.png'),
		jobs: [
			JOBS.RED_MAGE,
		],
	},
	MYPS: {
		name: 'Myps',
		avatar: require('./avatar/Myps.png'),
		jobs: [
			JOBS.RED_MAGE,
		],
	},
	JONNIX: {
		name: 'Jonnix',
		avatar: require('./avatar/jonnix.png'),
		jobs: [
			JOBS.GUNBREAKER,
		],
	},
	ARIA: {
		name: 'Aria',
		avatar: require('./avatar/aria.png'),
		jobs: [
			JOBS.PALADIN,
		],
	},
	EDEN: {
		name: 'Eden',
		avatar: require('./avatar/Eden.png'),
		jobs: [
			JOBS.GUNBREAKER,
		],
	},
	FURST: {
		name: 'Fürst',
		avatar: require('./avatar/Furst.png'),
		jobs: [
			JOBS.BLACK_MAGE,
		],
	},
	YUMIYA: {
		name: 'Yumiya',
		avatar: require('./avatar/Yumiya.png'),
		jobs: [
			JOBS.BARD,
		],
	},
	KERRIS: {
		name: 'Kerris',
		avatar: require('./avatar/kerris.png'),
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
