import {ensureStatuses} from '../type'

export const RDM = ensureStatuses({
	DUALCAST: {
		id: 1249,
		name: 'Dualcast',
		icon: 'https://xivapi.com/i/013000/013406.png',
		duration: 15000,
	},
	VERSTONE_READY: {
		id: 1235,
		name: 'Verstone Ready',
		icon: 'https://xivapi.com/i/013000/013403.png',
		duration: 30000,
	},
	VERFIRE_READY: {
		id: 1234,
		name: 'Verfire Ready',
		icon: 'https://xivapi.com/i/013000/013402.png',
		duration: 30000,
	},
	ACCELERATION: {
		id: 1238,
		name: 'Acceleration',
		icon: 'https://xivapi.com/i/013000/013405.png',
		duration: 20000,
		stacksApplied: 3,
	},
	EMBOLDEN_PARTY: {
		// Note that this is the Embolden that other people receive from RDM
		id: 1297,
		name: 'Embolden',
		icon: 'https://xivapi.com/i/018000/018941.png',
		duration: 20000,
	},
	EMBOLDEN_SELF: {
		// Note that this is the Embolden that the RDM casting receives
		id: 1239,
		name: 'Embolden',
		icon: 'https://xivapi.com/i/018000/018921.png',
		duration: 20000,
	},
	MANAFICATION: {
		id: 1971,
		name: 'Manafication',
		icon: 'https://xivapi.com/i/013000/013407.png',
		duration: 10000,
	},
	MAGICK_BARRIER: {
		id: 1971,
		name: 'Magick Barrier',
		icon: 'https://xivapi.com/i/013000/013408.png',
		duration: 10000,
	},
})
