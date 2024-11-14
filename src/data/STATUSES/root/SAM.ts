import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'
import {SHARED} from './SHARED'

export const SAM = ensureStatuses({
	THIRD_EYE: {
		id: 1232,
		name: 'Third Eye',
		icon: iconUrl(213307),
		duration: 4000,
	},
	TENGETSU: {
		id: 3853,
		name: 'Tengetsu',
		icon: iconUrl(213316),
		duration: 4000,
	},

	TENGETSU_FORESIGHT: {
		id: 3854,
		name: "Tengetsu's Foresight",
		icon: iconUrl(213317),
		duration: 8000,

	},

	FUGETSU: {
		id: 1298,
		name: 'Fugetsu',
		icon: iconUrl(213311),
		duration: 40000,
	},

	FUKA: {
		id: 1299,
		name: 'Fuka',
		icon: iconUrl(213312),
		duration: 40000,
		speedModifier: 0.87,
	},

	MEDITATE: {
		id: 1231,
		name: 'Meditate',
		icon: iconUrl(213306),
		duration: 15000,
	},

	MEDITATION: {
		id: 1865,
		name: 'Meditation',
		icon: iconUrl(219501),
		duration: 45000,
	},

	HIGANBANA: {
		id: 1228,
		name: 'Higanbana',
		icon: iconUrl(213304),
		duration: 60000,
	},

	MEIKYO_SHISUI: {
		id: 1233,
		name: 'Meikyo Shisui',
		icon: iconUrl(213309),
		duration: 15000,
		stacksApplied: 3,
	},

	ENHANCED_ENPI: {
		id: 1236,
		name: 'Enhanced Enpi',
		icon: iconUrl(213310),
		duration: 15000,
	},

	OGI_NAMIKIRI_READY: {
		id: 2959,
		name: 'Ogi Namikiri Ready',
		icon: iconUrl(213313),
		duration: 30000,
	},

	TSUBAME_GAESHI_READY: {
		id: 3852,
		name: 'Tsubame-Gaeshi Ready',
		icon: iconUrl(213315),
		duration: 30000,
	},

	TSUBAME_GAESHI_MIDARE: SHARED.UNKNOWN,
	TSUBAME_GAESHI_TENDO_MIDARE: SHARED.UNKNOWN,
	TSUBAME_GAESHI_TENDO_GOKEN: SHARED.UNKNOWN,

	ZANSHIN_READY: {
		id: 3855,
		name: 'Zanshin Ready',
		icon: iconUrl(213318),
		duration: 30000,
	},

	TENDO: {
		id: 3856,
		name: 'Tendo',
		icon: iconUrl(213319),
		duration: 30000,
	},

})
