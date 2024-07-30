import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'
import {SHARED} from './SHARED'

export const VPR = ensureStatuses({

	NOXIOUS_GNASH: { //debuff applied to enemy
		id: 3667,
		name: 'Noxious Gnash',
		icon: iconUrl(13773),
		duration: 20000,
	},

	HONED_STEEL: SHARED.UNKNOWN,
	HONED_REAVERS: SHARED.UNKNOWN,

	HUNTERS_INSTINCT: {
		id: 3668,
		name: "Hunter's Instinct",
		icon: iconUrl(13774),
		duration: 40000,
	},

	SWIFTSCALED: {
		id: 3669,
		name: 'Swiftscaled',
		icon: iconUrl(13775),
		duration: 40000,
		speedModifier: 0.85,
	},

	FLANKSTUNG_VENOM: {
		id: 3645,
		name: 'Flankstung Venom',
		icon: iconUrl(13751),
		duration: 40000,
	},

	FLANKSBANE_VENOM: {
		id: 3646,
		name: 'Flanksbane Venom',
		icon: iconUrl(13752),
		duration: 40000,
	},

	HINDSTUNG_VENOM: {
		id: 3647,
		name: 'Hindstung Venom',
		icon: iconUrl(13753),
		duration: 40000,
	},

	HINDSBANE_VENOM: {
		id: 3648,
		name: 'Hindsbane Venom',
		icon: iconUrl(13754),
		duration: 40000,
	},

	GRIMHUNTERS_VENOM: {
		id: 3649,
		name: "Grimhunter's Venom",
		icon: iconUrl(13755),
		duration: 40000,
	},

	GRIMSKINS_VENOM: {
		id: 3650,
		name: "Grimskin's Venom",
		icon: iconUrl(13756),
		duration: 40000,
	},

	HUNTERS_VENOM: {
		id: 3657,
		name: "Hunter's Venom",
		icon: iconUrl(13763),
		duration: 30000,
	},

	SWIFTSKINS_VENOM: {
		id: 3658,
		name: "Swiftskin's Venom",
		icon: iconUrl(13764),
		duration: 30000,
	},

	FELLHUNTERS_VENOM: {
		id: 3659,
		name: "Fellhunter's Venom",
		icon: iconUrl(13765),
		duration: 30000,
	},

	FELLSKINS_VENOM: {
		id: 3660,
		name: "Fellskin's Venom",
		icon: iconUrl(13766),
		duration: 30000,
	},

	POISED_FOR_TWINFANG: {
		id: 3665,
		name: 'Poised for Twinfang',
		icon: iconUrl(13771),
		duration: 60000,
	},

	POISED_FOR_TWINBLOOD: {
		id: 3666,
		name: 'Poised for Twinblood',
		icon: iconUrl(13772),
		duration: 60000,
	},

	READY_TO_REAWAKEN: {
		id: 3671,
		name: 'Ready to Reawaken',
		icon: iconUrl(13777),
		duration: 30000,
	},

	REAWAKENED: {
		id: 3670,
		name: 'Reawakened',
		icon: iconUrl(13776),
		duration: 30000,
	},

})
