import {ensureStatuses} from '../type'

export const DRG = ensureStatuses({
	BATTLE_LITANY: {
		id: 786,
		name: 'Battle Litany',
		icon: 'https://xivapi.com/i/012000/012578.png',
		duration: 15000,
	},

	RIGHT_EYE: {
		id: 1453,
		name: 'Right Eye',
		icon: 'https://xivapi.com/i/012000/012581.png',
		duration: 20000,
	},

	// Because apparently Right Eye has a different status ID if you don't have a tether partner. Thanks, SE.
	RIGHT_EYE_SOLO: {
		id: 1910,
		name: 'Right Eye',
		icon: 'https://xivapi.com/i/012000/012581.png',
		duration: 20000,
	},

	LEFT_EYE: {
		id: 1454,
		name: 'Left Eye',
		icon: 'https://xivapi.com/i/012000/012582.png',
		duration: 20000,
	},

	POWER_SURGE: {
		id: 0,  // TODO: real id
		name: 'Power Surge',
		icon: 'https://xivapi.com/i/012000/012576.png', // TODO: Real icon
		duration: 30000,
	},

	SHARPER_FANG_AND_CLAW: {
		id: 802,
		name: 'Sharper Fang and Claw',
		icon: 'https://xivapi.com/i/012000/012579.png',
		duration: 10000,
	},

	ENHANCED_WHEELING_THRUST: {
		id: 803,
		name: 'Enhanced Wheeling Thrust',
		icon: 'https://xivapi.com/i/012000/012580.png',
		duration: 10000,
	},

	LANCE_CHARGE: {
		id: 1864,
		name: 'Lance Charge',
		icon: 'https://xivapi.com/i/010000/010304.png',
		duration: 20000,
	},

	CHAOS_THRUST: {
		id: 118,
		name: 'Chaos Thrust',
		icon: 'https://xivapi.com/i/010000/010307.png',
		duration: 24000,
	},

	DIVE_READY: {
		id: 1243,
		name: 'Dive Ready',
		icon: 'https://xivapi.com/i/012000/012583.png',
		duration: 15000,
	},

	LIFE_SURGE: {
		id: 116,
		name: 'Life Surge',
		icon: 'https://xivapi.com/i/010000/010302.png',
		duration: 5000,
	},

	RAIDEN_THRUST_READY: {
		id: 1863,
		name: 'Raiden Thrust Ready',
		icon: 'https://xivapi.com/i/012000/012584.png',
		duration: 10000,
	},

	DRACONIAN_FIRE: {
		id: 0, // todo: real id
		name: 'Draconian Fire',
		icon: 'https://xivapi.com/i/012000/012584.png', // todo: real id
		duration: 30000,
	},
})
