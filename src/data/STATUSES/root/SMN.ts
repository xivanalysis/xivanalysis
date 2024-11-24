import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'
import {SHARED} from './SHARED'

// TODO: Fill in the rest of this
export const SMN = ensureStatuses({
	RADIANT_AEGIS: {
		id: 2702,
		name: 'Radiant Aegis',
		icon: iconUrl(212691),
		duration: 30000,
	},

	FURTHER_RUIN: {
		id: 1212,
		name: 'Further Ruin',
		icon: iconUrl(212685),
		duration: 60000,
	},

	SEARING_LIGHT: {
		id: 2703,
		name: 'Searing Light',
		icon: iconUrl(212699),
		duration: 30000,
	},

	EVERLASTING_FLIGHT: {
		id: 1868,
		name: 'Everlasting Flight',
		icon: iconUrl(212732),
		duration: 21000,
	},

	REKINDLE: {
		id: 2704,
		name: 'Rekindle',
		icon: iconUrl(212693),
		duration: 30000,
	},

	UNDYING_FLAME: {
		id: 2705,
		name: 'Undying Flame',
		icon: iconUrl(212694),
		duration: 15000,
	},

	SLIPSTREAM: {
		id: 2706,
		name: 'Slipstream',
		icon: iconUrl(212695),
		duration: 15000,
	},

	CRIMSON_STRIKE_READY: SHARED.UNKNOWN,
})
