import {ensureStatuses} from '../type'

export const SAM = ensureStatuses({
	THIRD_EYE: {
		id: 1232,
		name: 'Third Eye',
		icon: 'https://xivapi.com/i/013000/013307.png',
		duration: 4000,
	},
	TENGETSU: { //TODO: Icon
		id: 3853,
		name: 'Tengetsu',
		icon: 'icon',
		duration: 4000,
	},

	TENGETSU_FORESIGHT: {
		id: 3854,
		name: "Tengetsu's Foresight",
		icon: 'icon',
		duration: 8000,

	},

	FUGETSU: {
		id: 1298,
		name: 'Fugetsu',
		icon: 'https://xivapi.com/i/013000/013311.png',
		duration: 40000,
	},

	FUKA: {
		id: 1299,
		name: 'Fuka',
		icon: 'https://xivapi.com/i/013000/013312.png',
		duration: 40000,
		speedModifier: 0.87,
	},

	MEDITATE: {
		id: 1231,
		name: 'Meditate',
		icon: 'https://xivapi.com/i/013000/013306.png',
		duration: 15000,
	},

	MEDITATION: {
		id: 1865,
		name: 'Meditation',
		icon: 'https://xivapi.com/i/019000/019501.png',
		duration: 45000,
	},

	HIGANBANA: {
		id: 1228,
		name: 'Higanbana',
		icon: 'https://xivapi.com/i/013000/013304.png',
		duration: 60000,
	},

	MEIKYO_SHISUI: {
		id: 1233,
		name: 'Meikyo Shisui',
		icon: 'https://xivapi.com/i/013000/013309.png',
		duration: 15000,
		stacksApplied: 3,
	},

	ENHANCED_ENPI: {
		id: 1236,
		name: 'Enhanced Enpi',
		icon: 'https://xivapi.com/i/013000/013310.png',
		duration: 15000,
	},

	OGI_NAMIKIRI_READY: {
		id: 2959,
		name: 'Ogi Namikiri Ready',
		icon: 'https://xivapi.com/i/013000/013313.png',
		duration: 30000,
	},

	TSUBAME_GAESHI_READY: { //TODO: Id & Icon
		id: 0,
		name: 'Tsubame-Gaeshi Ready',
		icon: 'icon',
		duration: 30000,
	},

	ZANSHIN_READY: { //TODO: Id & Icon
		id: 166,
		name: 'Zanshin Ready',
		icon: 'icon',
		duration: 30000,
	},

	TENDO: { //TODO: Id & Icon
		id: 3856,
		name: 'Tendo',
		icon: 'icon',
		duration: 30000,
	},
})
