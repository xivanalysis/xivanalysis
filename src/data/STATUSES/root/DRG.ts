import {ensureStatuses} from '../type'

export const DRG = ensureStatuses({
	BATTLE_LITANY: {
		id: 786,
		name: 'Battle Litany',
		icon: 'https://xivapi.com/i/012000/012578.png',
		duration: 20000,
	},

	POWER_SURGE: {
		id: 2720,
		name: 'Power Surge',
		icon: 'https://xivapi.com/i/010000/010303.png',
		duration: 30000,
	},

	// I think these status effects are removed now with the addition of drakesbane
	// leaving commented out until actual status effect data can be found
	// SHARPER_FANG_AND_CLAW: {
	// 	id: 802,
	// 	name: 'Sharper Fang and Claw',
	// 	icon: 'https://xivapi.com/i/012000/012579.png',
	// 	duration: 10000,
	// },

	// ENHANCED_WHEELING_THRUST: {
	// 	id: 803,
	// 	name: 'Enhanced Wheeling Thrust',
	// 	icon: 'https://xivapi.com/i/012000/012580.png',
	// 	duration: 10000,
	// },

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

	CHAOTIC_SPRING: {
		id: 2719,
		name: 'Chaotic Spring',
		icon: 'https://xivapi.com/i/012000/012586.png',
		duration: 24000,
	},

	DIVE_READY: {
		id: 1243,
		name: 'Dive Ready',
		icon: 'https://xivapi.com/i/012000/012583.png',
		duration: 15000,
	},

	DRAGONS_FLIGHT: {
		id: 0, // TODO: actual id
		name: "Dragon's Flight",
		icon: '',
		duration: 30000,
	},

	STARCROSS_READY: {
		id: 0, // TODO: actual id
		name: 'Starcross Ready',
		icon: '',
		duration: 20000,
	},

	LIFE_SURGE: {
		id: 116,
		name: 'Life Surge',
		icon: 'https://xivapi.com/i/010000/010302.png',
		duration: 5000,
	},

	DRACONIAN_FIRE: {
		id: 1863,
		name: 'Draconian Fire',
		icon: 'https://xivapi.com/i/012000/012585.png',
		duration: 30000,
	},

	NASTROND_READY: {
		id: 0, // TODO: Actual id
		name: 'Nastrond Ready',
		icon: '',
		duration: 20000,
	},
})
