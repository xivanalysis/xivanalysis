import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'

export const BRD = ensureStatuses({
	// Self statuses
	HAWKS_EYE: {
		id: 3861,
		name: 'Hawk\'s Eye',
		icon: iconUrl(213075),
		duration: 30000,
	},
	RAGING_STRIKES: {
		id: 125,
		name: 'Raging Strikes',
		icon: iconUrl(210354),
		duration: 20000,
		amount: 0.15,
	},
	BARRAGE: {
		id: 128,
		name: 'Barrage',
		icon: iconUrl(210356),
		duration: 10000,
		amount: 3,
	},
	ARMYS_MUSE: {
		id: 1932,
		name: 'Army\'s Muse',
		icon: iconUrl(212619),
		duration: 10000,
	},
	ARMYS_ETHOS: {
		id: 1933,
		name: 'Army\'s Ethos',
		icon: iconUrl(212620),
		duration: 30000,
	},
	BLAST_ARROW_READY: {
		id: 2692,
		name: 'Blast Arrow Ready',
		icon: iconUrl(212621),
		duration: 10000,
	},
	RESONANT_ARROW_READY: {
		id: 3862,
		name: 'Resonant Arrow Ready',
		icon: iconUrl(213076),
		duration: 30000,
	},
	RADIANT_ENCORE_READY: {
		id: 3863,
		name: 'Radiant Encore Ready',
		icon: iconUrl(213077),
		duration: 30000,
	},

	// Enemy statuses
	VENOMOUS_BITE: {
		id: 124,
		name: 'Venomous Bite',
		icon: iconUrl(210352),
		// Duration depends on trait
		duration: 45000,
	},
	WINDBITE: {
		id: 129,
		name: 'Windbite',
		icon: iconUrl(210360),
		// Duration depends on trait
		duration: 45000,
	},
	CAUSTIC_BITE: {
		id: 1200,
		name: 'Caustic Bite',
		icon: iconUrl(212616),
		duration: 45000,
	},
	STORMBITE: {
		id: 1201,
		name: 'Stormbite',
		icon: iconUrl(212617),
		duration: 45000,
	},

	// Ally statuses
	MAGES_BALLAD: {
		id: 2217,
		name: 'Mage\'s Ballad',
		icon: iconUrl(212603),
		duration: 45000,
	},
	ARMYS_PAEON: {
		id: 2218,
		name: 'Army\'s Paeon',
		icon: iconUrl(212605),
		duration: 45000,
	},
	THE_WANDERERS_MINUET: {
		id: 2216,
		name: 'The Wanderer\'s Minuet',
		icon: iconUrl(212610),
		duration: 45000,
	},
	BATTLE_VOICE: {
		id: 141,
		name: 'Battle Voice',
		icon: iconUrl(212601),
		duration: 20000,
	},
	THE_WARDENS_PAEAN: {
		id: 866,
		name: 'The Warden\'s Paean',
		icon: iconUrl(212611),
		duration: 30000,
	},
	TROUBADOUR: {
		id: 1934,
		name: 'Troubadour',
		icon: iconUrl(212615),
		duration: 15000,
	},
	NATURES_MINNE: {
		id: 1202,
		name: 'Nature\'s Minne',
		icon: iconUrl(212618),
		duration: 15000,
	},
	RADIANT_FINALE: {
		id: 2964,
		name: 'Radiant Finale',
		icon: iconUrl(212622),
		duration: 20000,
	},
})
