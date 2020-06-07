import {ensureStatuses} from '../type'

export const SHARED = ensureStatuses({
	UNKNOWN: {
		id: 0,
		name: 'Unknown',
		// System action - red background, gold cross
		icon: 'https://xivapi.com/i/000000/000026.png',
	},
	RAISE: {
		id: 148,
		name: 'Raise',
		icon: 'https://xivapi.com/i/010000/010406.png',
	},

	WEAKNESS: {
		id: 43,
		name: 'Weakness',
		icon: 'https://xivapi.com/i/015000/015010.png',
	},

	BRINK_OF_DEATH: {
		id: 44,
		name: 'Brink of Death',
		icon: 'https://xivapi.com/i/015000/015011.png',
	},

	MEDICATED: {
		id: 49,
		name: 'Medicated',
		icon: 'https://xivapi.com/i/016000/016203.png',
	},

	WELL_FED: {
		id: 48,
		name: 'Well Fed',
		icon: 'https://xivapi.com/i/016000/016202.png',
	},

	SQUADRON_RATIONING_MANUAL: {
		id: 1084,
		name: 'Squadron Rationing Manual',
		icon: 'https://xivapi.com/i/016000/016508.png',
	},
})
