import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

export const patch630: Layer<ActionRoot> = {
	patch: '6.3',
	data: {
		// BRD - Nature's Minne CD change
		NATURES_MINNE: {cooldown: 120000},
		// DRG - Life Surge CD change
		LIFE_SURGE: {cooldown: 40000},
		// WHM - Assize CD change
		ASSIZE: {cooldown: 40000},

		// PLD 6.3 rework changes
		GORING_BLADE: {
			cooldown: 60000,
			gcdRecast: 2500,
			combo: undefined,
			statusesApplied: undefined,
		},
		ROYAL_AUTHORITY: {
			statusesApplied: ['SWORD_OATH', 'DIVINE_MIGHT'],
		},
		CONFITEOR: {
			combo: undefined,
		},
		BLADE_OF_FAITH: {
			combo: undefined,
		},
		BLADE_OF_TRUTH: {
			combo: undefined,
		},
		BLADE_OF_VALOR: {
			combo: undefined,
		},
		IRON_WILL: {
			cooldown: 2000,
		},
		RELEASE_IRON_WILL: {
			id: 32065,
			name: 'Release Iron Will',
			icon: 'https://xivapi.com/i/002000/002521.png',
			onGcd: false,
			cooldown: 1000,
		},
		BULWARK: {
			id: 22,
			name: 'Bulwark',
			icon: 'https://xivapi.com/i/000000/000167.png',
			onGcd: false,
			cooldown: 90000,
			statusesApplied: ['BULWARK'],
		},
		DIVINE_VEIL: {statusesApplied: ['DIVINE_VEIL']},

		/// SGE - Phlegma's cooldown (all tiers) was reduced to 40s
		PHLEGMA: {cooldown: 40000},
		PHLEGMA_II: {cooldown: 40000},
		PHLEGMA_III: {cooldown: 40000},

		// WAR 6.3 new statuses from actions
		SHAKE_IT_OFF: {statusesApplied: ['SHAKE_IT_OFF', 'SHAKE_IT_OFF_OVER_TIME']},

		// Tank stance changes
		DEFIANCE: {cooldown: 2000},
		GRIT: {cooldown: 2000},
		ROYAL_GUARD: {cooldown: 2000},

		RELEASE_DEFIANCE: {
			id: 32066,
			name: 'Release Defiance',
			icon: 'https://xivapi.com/i/002000/002572.png',
			onGcd: false,
			cooldown: 1000,
		},

		RELEASE_GRIT: {
			id: 32067,
			name: 'Release Grit',
			icon: 'https://xivapi.com/i/003000/003092.png',
			onGcd: false,
			cooldown: 1000,
		},

		RELEASE_ROYAL_GUARD: {
			id: 32068,
			name: 'Release Royal Guard',
			icon: 'https://xivapi.com/i/003000/003433.png',
			onGcd: false,
			cooldown: 1000,
		},

		// MNK - Riddle of Earth changes
		RIDDLE_OF_EARTH: {
			charges: undefined,
			cooldown: 120000,
		},

		// MCH 6.3 changes
		HYPERCHARGE: {statusesApplied: ['OVERHEATED']},
	},
}
