import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'

export const DRK = ensureStatuses({
	GRIT: {
		id: 743,
		name: 'Grit',
		icon: iconUrl(13108),
	},
	BLOOD_WEAPON: {
		id: 742,
		name: 'Blood Weapon',
		icon: iconUrl(13109),
		duration: 15000,
		stacksApplied: 5,
	},
	BLACKEST_NIGHT: {
		id: 1178,
		name: 'Blackest Night',
		icon: iconUrl(13118),
		duration: 7000,
	},
	SALTED_EARTH: {
		id: 749,
		name: 'Salted Earth',
		icon: iconUrl(13104),
		duration: 15000,
	},
	DARK_MISSIONARY: {
		id: 1894,
		name: 'Dark Missionary',
		icon: iconUrl(13122),
		duration: 15000,
	},
	LIVING_DEAD: {
		id: 810,
		name: 'Living Dead',
		icon: iconUrl(13115),
	},
	WALKING_DEAD: {
		id: 811,
		name: 'Walking Dead',
		icon: iconUrl(13116),
		duration: 10000,
	},

	UNDEAD_REBIRTH: {
		id: 3255,
		name: 'Undead Rebirth',
		icon: 'https://xivapi.com/i/013000/013124.png',
	},

	DARK_MIND: {
		id: 746,
		name: 'Dark Mind',
		icon: iconUrl(13114),
		duration: 10000,
	},
	SHADOW_WALL: {
		id: 747,
		name: 'Shadow Wall',
		icon: iconUrl(13113),
		duration: 15000,
	},
	DELIRIUM: {
		id: 1972,
		name: 'Delirium',
		icon: iconUrl(13121),
		duration: 10000,
		stacksApplied: 3,
	},
	OBLATION: {
		id: 2682,
		name: 'Oblation',
		icon: iconUrl(13123),
		duration: 10000,
	},
})
