import {MessageDescriptor} from '@lingui/core'
import {t} from '@lingui/macro'
import JOBS, {Job} from './JOBS'

export interface Contributor {
	name: string
	avatar?: string
	jobs: Job[]
}

// Be cool to hook this up to discord at some point - but does raise concerns if the user leaves the guild
const CONTRIBUTORS = {
	ACKWELL: {
		name: 'ackwell',
		avatar: process.env.PUBLIC_URL + '/avatar/ackwell.png',
		jobs: [
			JOBS.SUMMONER,
			JOBS.RED_MAGE,
			JOBS.BARD,
		],
	},
	NEMEKH: {
		name: 'Nemekh',
		avatar: process.env.PUBLIC_URL + '/avatar/nemekh.png',
		jobs: [JOBS.SUMMONER],
	},
	FRYTE: {
		name: 'Fryte',
		avatar: process.env.PUBLIC_URL + '/avatar/fryte.png',
		jobs: [JOBS.SUMMONER],
	},
	LEYLIA: {
		name: 'Leylia',
		avatar: process.env.PUBLIC_URL + '/avatar/Leylia.png',
		jobs: [
			JOBS.RED_MAGE,
		],
	},
	LIMA: {
		name: 'Lima',
		avatar: process.env.PUBLIC_URL + '/avatar/Lima.png',
		jobs: [JOBS.SCHOLAR],
	},
	SAYAKA: {
		name: 'Sayaka',
		avatar: process.env.PUBLIC_URL + '/avatar/sayaka.png',
		jobs: [JOBS.WARRIOR],
	},
	VULCWEN: {
		name: 'Vulcwen',
		avatar: process.env.PUBLIC_URL + '/avatar/vulcwen.png',
		jobs: [JOBS.WHITE_MAGE, JOBS.SUMMONER],
	},
	LAQI: {
		name: 'Laqi',
		avatar: process.env.PUBLIC_URL + '/avatar/laqi.png',
		jobs: [JOBS.BLACK_MAGE],
	},
	JUMP: {
		name: 'Jump',
		avatar: process.env.PUBLIC_URL + '/avatar/jump.png',
		jobs: [JOBS.RED_MAGE],
	},
	FURST: {
		name: 'Fürst',
		avatar: process.env.PUBLIC_URL + '/avatar/furst.png',
		jobs: [JOBS.BLACK_MAGE],
	},
	TOASTDEIB: {
		name: 'Toastdeib',
		avatar: process.env.PUBLIC_URL + '/avatar/toastdeib.png',
		jobs: [JOBS.NINJA, JOBS.MACHINIST],
	},
	MIKEMATRIX: {
		name: 'MikeMatrix',
		avatar: process.env.PUBLIC_URL + '/avatar/mikematrix.png',
		jobs: [JOBS.PALADIN, JOBS.WARRIOR],
	},
	YUMIYA: {
		name: 'Yumiya',
		avatar: process.env.PUBLIC_URL + '/avatar/yumiya.png',
		jobs: [JOBS.BARD],
	},
	RYAN: {
		name: 'Ryan',
		avatar: process.env.PUBLIC_URL + '/avatar/Rjb99.png',
		jobs: [JOBS.SAMURAI],
	},
	SUSHIROU: {
		name: 'suShirou',
		avatar: process.env.PUBLIC_URL + '/avatar/sushirou.png',
		jobs: [JOBS.ASTROLOGIAN],
	},
	ACRI: {
		name: 'Acri',
		avatar: process.env.PUBLIC_URL + '/avatar/acri.png',
		jobs: [JOBS.DARK_KNIGHT],
	},
	AKAIRYU: {
		name: 'Akairyu',
		avatar: process.env.PUBLIC_URL + '/avatar/Akairyu.png',
		jobs: [JOBS.BLACK_MAGE],
	},
	ASTRALEAH: {
		name: 'Astraleah',
		avatar: process.env.PUBLIC_URL + '/avatar/astraleah.png',
		jobs: [JOBS.DRAGOON],
	},
	ACCHAN: {
		name: 'acchan',
		avatar: process.env.PUBLIC_URL + '/avatar/acchan.png',
		jobs: [JOBS.MONK],
	},
	AZARIAH: {
		name: 'Azariah',
		avatar: process.env.PUBLIC_URL + '/avatar/azariah.png',
		jobs: [JOBS.RED_MAGE],
	},
	LHEA: {
		name: 'Lhea',
		avatar: process.env.PUBLIC_URL + '/avatar/lhea.png',
		jobs: [JOBS.PALADIN, JOBS.WARRIOR, JOBS.DARK_KNIGHT],
	},
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
