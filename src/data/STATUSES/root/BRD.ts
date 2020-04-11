import {ensureStatuses} from '../type'

export const BRD = ensureStatuses({
	// Self statuses
	STRAIGHT_SHOT_READY: {
		id: 122,
		name: 'Straight Shot Ready',
		icon: 'https://xivapi.com/i/010000/010365.png',
		duration: 10,
	},
	RAGING_STRIKES: {
		id: 125,
		name: 'Raging Strikes',
		icon: 'https://xivapi.com/i/010000/010354.png',
		duration: 20,
		amount: 0.1,
	},
	BARRAGE: {
		id: 128,
		name: 'Barrage',
		icon: 'https://xivapi.com/i/010000/010356.png',
		duration: 10,
		amount: 3,
	},
	ARMYS_MUSE: {
		id: 1932,
		name: 'Army\'s Muse',
		icon: 'https://xivapi.com/i/012000/012619.png',
		duration: 10,
	},
	ARMYS_ETHOS: {
		id: 1933,
		name: 'Army\'s Ethos',
		icon: 'https://xivapi.com/i/012000/012620.png',
		duration: 30,
	},

	// Enemy statuses
	VENOMOUS_BITE: {
		id: 124,
		name: 'Venomous Bite',
		icon: 'https://xivapi.com/i/010000/010352.png',
		// Duration depends on trait
		duration: 18,
	},
	WINDBITE: {
		id: 129,
		name: 'Windbite',
		icon: 'https://xivapi.com/i/010000/010360.png',
		// Duration depends on trait
		duration: 18,
	},
	CAUSTIC_BITE: {
		id: 1200,
		name: 'Caustic Bite',
		icon: 'https://xivapi.com/i/012000/012616.png',
		duration: 30,
	},
	STORMBITE: {
		id: 1201,
		name: 'Stormbite',
		icon: 'https://xivapi.com/i/012000/012617.png',
		duration: 30,
	},

	// Ally statuses
	BATTLE_VOICE: {
		id: 141,
		name: 'Battle Voice',
		icon: 'https://xivapi.com/i/012000/012601.png',
		duration: 20,
	},
	THE_WARDENS_PAEAN: {
		id: 866,
		name: 'The Warden\'s Paean',
		icon: 'https://xivapi.com/i/012000/012611.png',
		duration: 30,
	},
	TROUBADOUR: {
		id: 1934,
		name: 'Troubadour',
		icon: 'https://xivapi.com/i/012000/012615.png',
		duration: 15,
	},
	NATURES_MINNE: {
		id: 1202,
		name: 'Nature\'s Minne',
		icon: 'https://xivapi.com/i/012000/012618.png',
		duration: 15,
	},
})
