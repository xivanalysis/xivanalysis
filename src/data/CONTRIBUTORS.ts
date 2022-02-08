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
	ARKEVORKHAT: {
		name: 'Arkevorkhat',
		avatar: require('./avatar/Arkevorkhat.png'),
		jobs: [
			JOBS.REAPER, JOBS.RED_MAGE, JOBS.SUMMONER,
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
		avatar: require('./avatar/Ryan.png'),
		jobs: [
			JOBS.GUNBREAKER,
			JOBS.SAMURAI,
		],
	},
	LAILLE: {
		name: 'Laille',
		avatar: require('./avatar/Laille.png'),
		jobs: [
			JOBS.RED_MAGE,
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
	MALP: {
		name: 'Malp',
		avatar: require('./avatar/Malp.png'),
		jobs: [
			JOBS.MONK,
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
	MR_RAZOR: {
		name: 'Mr Razor',
		avatar: require('./avatar/mr_razor.png'),
		jobs: [
			JOBS.REAPER,
		],
	},
	DTHOMASH: {
		name: 'dthomash',
		avatar: require('./avatar/dthomash.png'),
		jobs: [
			JOBS.SCHOLAR,
		],
	},
	KALITTLES: {
		name: 'Kalittles',
		avatar: require('./avatar/Kalittles.png'),
		jobs: [
			JOBS.SAMURAI,
		],
	},
	SUSHIROU: {
		name: 'suShirou',
		avatar: require('./avatar/sushirou.png'),
		jobs: [
			JOBS.ASTROLOGIAN,
		],
	},
	DEAN: {
		name: 'dean',
		avatar: require('./avatar/dean.png'),
		jobs: [
			JOBS.REAPER,
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
