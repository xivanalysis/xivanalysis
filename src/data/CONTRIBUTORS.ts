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
		avatar: require('./avatar/ackwell.png'),
		jobs: [
			JOBS.SUMMONER,
			JOBS.RED_MAGE,
			JOBS.BARD,
		],
	},
	NEMEKH: {
		name: 'Nemekh',
		avatar: require('./avatar/nemekh.png'),
		jobs: [JOBS.SUMMONER],
	},
	FRYTE: {
		name: 'Fryte',
		avatar: require('./avatar/fryte.png'),
		jobs: [JOBS.SUMMONER],
	},
	LEYLIA: {
		name: 'Leylia',
		avatar: require('./avatar/Leylia.png'),
		jobs: [
			JOBS.RED_MAGE,
		],
	},
	LIMA: {
		name: 'Lima',
		avatar: require('./avatar/Lima.png'),
		jobs: [JOBS.SCHOLAR],
	},
	SKYE: {
		name: 'Skye',
		avatar: require('./avatar/sayaka.png'),
		jobs: [JOBS.WARRIOR],
	},
	VULCWEN: {
		name: 'Vulcwen',
		avatar: require('./avatar/vulcwen.png'),
		jobs: [JOBS.WHITE_MAGE, JOBS.SUMMONER],
	},
	LAQI: {
		name: 'Laqi',
		avatar: require('./avatar/laqi.png'),
		jobs: [JOBS.BLACK_MAGE],
	},
	JUMP: {
		name: 'Jump',
		avatar: require('./avatar/jump.png'),
		jobs: [JOBS.RED_MAGE],
	},
	FURST: {
		name: 'Fürst',
		avatar: require('./avatar/furst.png'),
		jobs: [JOBS.BLACK_MAGE],
	},
	TOASTDEIB: {
		name: 'Toastdeib',
		avatar: require('./avatar/toastdeib.png'),
		jobs: [JOBS.NINJA, JOBS.MACHINIST],
	},
	MIKEMATRIX: {
		name: 'MikeMatrix',
		avatar: require('./avatar/mikematrix.png'),
		jobs: [
			JOBS.GUNBREAKER,
			JOBS.DARK_KNIGHT,
			JOBS.WARRIOR,
			JOBS.PALADIN,
		],
	},
	YUMIYA: {
		name: 'Yumiya',
		avatar: require('./avatar/yumiya.png'),
		jobs: [JOBS.BARD],
	},
	RYAN: {
		name: 'Ryan',
		avatar: require('./avatar/Rjb99.png'),
		jobs: [JOBS.SAMURAI],
	},
	SUSHIROU: {
		name: 'suShirou',
		avatar: require('./avatar/sushirou.png'),
		jobs: [JOBS.ASTROLOGIAN],
	},
	ACRI: {
		name: 'Acri',
		avatar: require('./avatar/acri.png'),
		jobs: [JOBS.DARK_KNIGHT],
	},
	AKAIRYU: {
		name: 'Akairyu',
		avatar: require('./avatar/Akairyu.png'),
		jobs: [JOBS.BLACK_MAGE, JOBS.DANCER],
	},
	ASTRALEAH: {
		name: 'Astraleah',
		avatar: require('./avatar/astraleah.png'),
		jobs: [JOBS.DRAGOON],
	},
	ACCHAN: {
		name: 'acchan',
		avatar: require('./avatar/acchan.png'),
		jobs: [JOBS.MONK],
	},
	AZARIAH: {
		name: 'Azariah',
		avatar: require('./avatar/azariah.png'),
		jobs: [JOBS.RED_MAGE],
	},
	LHEA: {
		name: 'Lhea',
		avatar: require('./avatar/lhea.png'),
		jobs: [JOBS.PALADIN, JOBS.WARRIOR, JOBS.DARK_KNIGHT],
	},
	NIV: {
		name: 'Niv',
		avatar: require('./avatar/niv.png'),
		jobs: [JOBS.WHITE_MAGE],
	},
	RIRIAN: {
		name: 'Ririan',
		avatar: require('./avatar/Ririan.png'),
		jobs: [JOBS.BARD, JOBS.MACHINIST],
	},
	TWO_BROKEN: {
		name: '2Broken',
		avatar: require('./avatar/2Broken.png'),
		jobs: [JOBS.DANCER],
	},
	NONO: {
		name: 'Nonowazu',
		avatar: require('./avatar/nono.png'),
		jobs: [JOBS.SCHOLAR],
	},
	KELOS: {
		name: 'Kelos',
		avatar: require('./avatar/kelos.png'),
		jobs: [JOBS.SUMMONER],
	},
	QAPHLA: {
		name: 'qaphla',
		jobs: [JOBS.PALADIN, JOBS.GUNBREAKER],
	},
	FALINDRITH: {
		name: 'Falindrith',
		avatar: require('./avatar/falindrith.png'),
		jobs: [JOBS.DRAGOON],
	},
	PAIGE_404: {
		name: 'Paige 404',
		avatar: require('./avatar/paige_404.png'),
		jobs: [JOBS.BLUE_MAGE],
	},
	RITASHI: {
		name: 'Ritashi',
		jobs: [JOBS.SUMMONER],
	},
	YUMIYAFANGIRL: {
		name: 'yumiyafangirl',
		avatar: require('./avatar/yumiyafangirl.png'),
		jobs: [JOBS.MACHINIST],
	},
	RIETTY: {
		name: 'Rietty',
		avatar: require('./avatar/rietty.png'),
		jobs: [JOBS.DRAGOON],
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
