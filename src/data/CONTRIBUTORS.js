import JOBS from './JOBS'

// Be cool to hook this up to discord at some point - but does raise concerns if the user leaves the guild
export default {
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
		avatar: process.env.PUBLIC_URL + '/avatar/Furst.png',
		jobs: [JOBS.BLACK_MAGE],
	},
	TOASTDEIB: {
		name: 'Toastdeib',
		avatar: process.env.PUBLIC_URL + '/avatar/toastdeib.png',
		jobs: [JOBS.NINJA],
	},
	MIKEMATRIX: {
		name: 'MikeMatrix',
		avatar: process.env.PUBLIC_URL + '/avatar/mikematrix.png',
		jobs: [JOBS.PALADIN, JOBS.WARRIOR],
	},
}
