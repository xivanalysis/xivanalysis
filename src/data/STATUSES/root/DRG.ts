import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'

export const DRG = ensureStatuses({
	BATTLE_LITANY: {
		id: 786,
		name: 'Battle Litany',
		icon: iconUrl(12578),
		duration: 15000,
	},

	RIGHT_EYE: {
		id: 1453,
		name: 'Right Eye',
		icon: iconUrl(12581),
		duration: 20000,
	},

	// Because apparently Right Eye has a different status ID if you don't have a tether partner. Thanks, SE.
	RIGHT_EYE_SOLO: {
		id: 1910,
		name: 'Right Eye',
		icon: iconUrl(12581),
		duration: 20000,
	},

	LEFT_EYE: {
		id: 1454,
		name: 'Left Eye',
		icon: iconUrl(12582),
		duration: 20000,
	},

	POWER_SURGE: {
		id: 2720,
		name: 'Power Surge',
		icon: iconUrl(10303),
		duration: 30000,
	},

	SHARPER_FANG_AND_CLAW: {
		id: 802,
		name: 'Sharper Fang and Claw',
		icon: iconUrl(12579),
		duration: 10000,
	},

	ENHANCED_WHEELING_THRUST: {
		id: 803,
		name: 'Enhanced Wheeling Thrust',
		icon: iconUrl(12580),
		duration: 10000,
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
})
