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
<<<<<<< HEAD
	LEYLIA: {
		name: 'Leylia',
		avatar: process.env.PUBLIC_URL + '/avatar/Leylia.png',
		jobs: [
			JOBS.RED_MAGE,
		],
	},
=======
>>>>>>> e809b85810026d54dabe7e900082e6ec2cf7ac29

	SAYAKA: {
		name: 'Sayaka',
		avatar: process.env.PUBLIC_URL + '/avatar/sayaka.png',
		jobs: [JOBS.WARRIOR],
	},
}
