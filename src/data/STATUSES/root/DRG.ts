import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'

export const DRG = ensureStatuses({
	BATTLE_LITANY: {
		id: 786,
		name: 'Battle Litany',
		icon: iconUrl(12578),
		duration: 15000,
	},

	POWER_SURGE: {
		id: 2720,
		name: 'Power Surge',
		icon: iconUrl(10303),
		duration: 30000,
	},

	LANCE_CHARGE: {
		id: 1864,
		name: 'Lance Charge',
		icon: iconUrl(10304),
		duration: 20000,
	},

	CHAOS_THRUST: {
		id: 118,
		name: 'Chaos Thrust',
		icon: iconUrl(10307),
		duration: 24000,
	},

	CHAOTIC_SPRING: {
		id: 2719,
		name: 'Chaotic Spring',
		icon: iconUrl(12586),
		duration: 24000,
	},

	DIVE_READY: {
		id: 1243,
		name: 'Dive Ready',
		icon: iconUrl(12583),
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
		icon: iconUrl(10302),
		duration: 5000,
	},

	DRACONIAN_FIRE: {
		id: 1863,
		name: 'Draconian Fire',
		icon: iconUrl(12585),
		duration: 30000,
	},

	NASTROND_READY: {
		id: 0, // TODO: Actual id
		name: 'Nastrond Ready',
		icon: '',
		duration: 20000,
	},
})
