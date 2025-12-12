import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'

export const DRK = ensureStatuses({
	GRIT: {
		id: 743,
		name: 'Grit',
		icon: iconUrl(213108),
	},
	BLOOD_WEAPON: {
		id: 742,
		name: 'Blood Weapon',
		icon: iconUrl(213109),
		duration: 15000,
		stacksApplied: 3,
	},
	BLACKEST_NIGHT: {
		id: 1178,
		name: 'Blackest Night',
		icon: iconUrl(213118),
		duration: 7000,
	},
	SALTED_EARTH: {
		id: 749,
		name: 'Salted Earth',
		icon: iconUrl(213104),
		duration: 15000,
	},
	DARK_MISSIONARY: {
		id: 1894,
		name: 'Dark Missionary',
		icon: iconUrl(213122),
		duration: 15000,
	},
	LIVING_DEAD: {
		id: 810,
		name: 'Living Dead',
		icon: iconUrl(213115),
	},
	WALKING_DEAD: {
		id: 811,
		name: 'Walking Dead',
		icon: iconUrl(213116),
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
		icon: iconUrl(213114),
		duration: 10000,
	},
	SHADOW_WALL: {
		id: 747,
		name: 'Shadow Wall',
		icon: iconUrl(213113),
		duration: 15000,
	},
	DELIRIUM: {
		id: 3836,
		name: 'Delirium',
		icon: iconUrl(217147),
		duration: 15000,
		stacksApplied: 3,
	},
	OBLATION: {
		id: 2682,
		name: 'Oblation',
		icon: iconUrl(213123),
		duration: 10000,
	},
	SHADOWED_VIGIL: {
		id: 3835,
		name: 'Shadowed Vigil',
		icon: iconUrl(213125),
		duration: 15000,
	},
	VIGILANT: {
		id: 3902,
		name: 'Vigilant',
		icon: iconUrl(213127),
		duration: 20000,
	},
	SCORN: {
		id: 3837,
		name: 'Scorn',
		icon: iconUrl(213126),
		duration: 30000,
	},
})
