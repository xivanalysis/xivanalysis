import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'

export const SAM = ensureStatuses({
	THIRD_EYE: {
		id: 1232,
		name: 'Third Eye',
		icon: iconUrl(13307),
		duration: 4000,
	},
	TENGETSU: { //TODO: Icon
		id: 3853,
		name: 'Tengetsu',
		icon: iconUrl(3853),
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
		icon: iconUrl(13311),
		duration: 40000,
	},

	FUKA: {
		id: 1299,
		name: 'Fuka',
		icon: iconUrl(13312),
		duration: 40000,
		speedModifier: 0.87,
	},

	MEDITATE: {
		id: 1231,
		name: 'Meditate',
		icon: iconUrl(13306),
		duration: 15000,
	},

	MEDITATION: {
		id: 1865,
		name: 'Meditation',
		icon: iconUrl(19501),
		duration: 45000,
	},

	HIGANBANA: {
		id: 1228,
		name: 'Higanbana',
		icon: iconUrl(13304),
		duration: 60000,
	},

	MEIKYO_SHISUI: {
		id: 1233,
		name: 'Meikyo Shisui',
		icon: iconUrl(13309),
		duration: 15000,
		stacksApplied: 3,
	},

	ENHANCED_ENPI: {
		id: 1236,
		name: 'Enhanced Enpi',
		icon: iconUrl(13310),
		duration: 15000,
	},

	OGI_NAMIKIRI_READY: {
		id: 2959,
		name: 'Ogi Namikiri Ready',
		icon: iconUrl(13313),
		duration: 30000,
	},

	TSUBAME_GAESHI_READY: { //TODO: Id & Icon
		id: 3852,
		name: 'Tsubame-Gaeshi Ready',
		icon: iconUrl(3852),
		duration: 30000,
	},

	ZANSHIN_READY: { //TODO: Id & Icon
		id: 3855,
		name: 'Zanshin Ready',
		icon: iconUrl(3855),
		duration: 30000,
	},

	TENDO: { //TODO: Id & Icon
		id: 3856,
		name: 'Tendo',
		icon: iconUrl(3856),
		duration: 30000,
	},
})
