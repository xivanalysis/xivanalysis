import {ensureStatuses} from '../type'
import {SHARED} from './SHARED'

export const MCH = ensureStatuses({
	REASSEMBLED: {
		id: 851,
		name: 'Reassembled',
		icon: 'https://xivapi.com/i/013000/013001.png',
		duration: 5000,
	},

	OVERHEATED: SHARED.UNKNOWN, // Added in patch 6.3 layer

	WILDFIRE: {
		id: 861,
		name: 'Wildfire',
		icon: 'https://xivapi.com/i/013000/013011.png',
		duration: 10000,
	},

	WILDFIRE_SELF: {
		id: 1946,
		name: 'Wildfire',
		icon: 'https://xivapi.com/i/013000/013019.png',
		duration: 10000,
	},

	FLAMETHROWER: {
		id: 1205,
		name: 'Flamethrower',
		icon: 'https://xivapi.com/i/013000/013017.png',
		duration: 10000,
	},

	BIOBLASTER: {
		id: 1866,
		name: 'Bioblaster',
		icon: 'https://xivapi.com/i/013000/013020.png',
		duration: 15000,
	},

	TACTICIAN: {
		id: 1951,
		name: 'Tactician',
		icon: 'https://xivapi.com/i/013000/013021.png',
		duration: 15000,
	},
})
