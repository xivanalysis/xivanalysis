import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'

export const SHARED = ensureStatuses({
	UNKNOWN: {
		id: 0,
		name: 'Unknown',
		// System action - red background, gold cross
		icon: iconUrl(26),
	},

	RAISE: {
		id: 148,
		name: 'Raise',
		icon: iconUrl(10406),
	},

	WEAKNESS: {
		id: 43,
		name: 'Weakness',
		icon: iconUrl(15010),
	},

	BRINK_OF_DEATH: {
		id: 44,
		name: 'Brink of Death',
		icon: iconUrl(15011),
	},

	TRANSCENDENT: {
		id: 418,
		name: 'Transcendent',
		icon: iconUrl(15273),
		duration: 5000,
	},

	MEDICATED: {
		id: 49,
		name: 'Medicated',
		icon: iconUrl(16203),
	},

	WELL_FED: {
		id: 48,
		name: 'Well Fed',
		icon: iconUrl(16202),
	},

	SQUADRON_RATIONING_MANUAL: {
		id: 1084,
		name: 'Squadron Rationing Manual',
		icon: iconUrl(16508),
	},
})
