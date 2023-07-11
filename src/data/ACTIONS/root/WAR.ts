import {Attribute} from 'event'
import {ensureActions} from '../type'
import {SHARED} from './SHARED'

export const WAR = ensureActions({
	// -----
	// Player GCDs
	// -----

	TOMAHAWK: {
		id: 46,
		name: 'Tomahawk',
		icon: 'https://xivapi.com/i/000000/000261.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},

	HEAVY_SWING: {
		id: 31,
		name: 'Heavy Swing',
		icon: 'https://xivapi.com/i/000000/000260.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	MAIM: {
		id: 37,
		name: 'Maim',
		icon: 'https://xivapi.com/i/000000/000255.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 31,
		},
	},

	STORMS_PATH: {
		id: 42,
		name: 'Storm\'s Path',
		icon: 'https://xivapi.com/i/000000/000258.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 37,
			end: true,
		},
	},

	STORMS_EYE: {
		id: 45,
		name: 'Storm\'s Eye',
		icon: 'https://xivapi.com/i/000000/000264.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['SURGING_TEMPEST'],
		combo: {
			from: 37,
			end: true,
		},
	},

	FELL_CLEAVE: {
		id: 3549,
		name: 'Fell Cleave',
		icon: 'https://xivapi.com/i/002000/002557.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},

	INNER_CHAOS: {
		id: 16465,
		name: 'Inner Chaos',
		icon: 'https://xivapi.com/i/002000/002568.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},

	OVERPOWER: {
		id: 41,
		name: 'Overpower',
		icon: 'https://xivapi.com/i/000000/000254.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	MYTHRIL_TEMPEST: {
		id: 16462,
		name: 'Mythril Tempest',
		icon: 'https://xivapi.com/i/002000/002565.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['SURGING_TEMPEST'],
		combo: {
			from: 41,
			end: true,
		},
	},

	DECIMATE: {
		id: 3550,
		name: 'Decimate',
		icon: 'https://xivapi.com/i/002000/002558.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},

	CHAOTIC_CYCLONE: {
		id: 16463,
		name: 'Chaotic Cyclone',
		icon: 'https://xivapi.com/i/002000/002566.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},

	PRIMAL_REND: {
		id: 25753,
		name: 'Primal Rend',
		icon: 'https://xivapi.com/i/002000/002571.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},

	// -----
	// Player OGCDs
	// -----
	EQUILIBRIUM: {
		id: 3552,
		name: 'Equilibrium',
		icon: 'https://xivapi.com/i/002000/002560.png',
		cooldown: 60000,
		statusesApplied: ['EQUILIBRIUM'],
	},

	THRILL_OF_BATTLE: {
		id: 40,
		name: 'Thrill of Battle',
		icon: 'https://xivapi.com/i/000000/000263.png',
		cooldown: 90000,
		statusesApplied: ['THRILL_OF_BATTLE'],
	},

	HOLMGANG: {
		id: 43,
		name: 'Holmgang',
		icon: 'https://xivapi.com/i/000000/000266.png',
		cooldown: 240000,
		statusesApplied: ['HOLMGANG'],
	},

	VENGEANCE: {
		id: 44,
		name: 'Vengeance',
		icon: 'https://xivapi.com/i/000000/000267.png',
		cooldown: 120000,
		statusesApplied: ['VENGEANCE'],
	},

	BLOODWHETTING: {
		id: 25751,
		name: 'Bloodwhetting',
		icon: 'https://xivapi.com/i/002000/002569.png',
		cooldown: 25000,
		cooldownGroup: 4,
		statusesApplied: ['BLOODWHETTING', 'STEM_THE_FLOW', 'STEM_THE_TIDE'],
	},

	NASCENT_FLASH: {
		id: 16464,
		name: 'Nascent Flash',
		icon: 'https://xivapi.com/i/002000/002567.png',
		cooldown: 25000,
		cooldownGroup: 4,
		statusesApplied: ['NASCENT_FLASH', 'NASCENT_GLINT', 'STEM_THE_FLOW', 'STEM_THE_TIDE'],
	},

	SHAKE_IT_OFF: {
		id: 7388,
		name: 'Shake It Off',
		icon: 'https://xivapi.com/i/002000/002563.png',
		cooldown: 90000,
		statusesApplied: ['SHAKE_IT_OFF'],
	},

	ONSLAUGHT: {
		id: 7386,
		name: 'Onslaught',
		icon: 'https://xivapi.com/i/002000/002561.png',
		cooldown: 30000,
		charges: 3,
	},

	UPHEAVAL: {
		id: 7387,
		name: 'Upheaval',
		icon: 'https://xivapi.com/i/002000/002562.png',
		cooldown: 30000,
		cooldownGroup: 6,
	},

	OROGENY: {
		id: 25752,
		name: 'Orogeny',
		icon: 'https://xivapi.com/i/002000/002570.png',
		cooldown: 30000,
		cooldownGroup: 6,
	},

	INNER_RELEASE: {
		id: 7389,
		name: 'Inner Release',
		icon: 'https://xivapi.com/i/002000/002564.png',
		cooldown: 60000,
		statusesApplied: ['INNER_RELEASE', 'PRIMAL_REND_READY'],
	},

	INFURIATE: {
		id: 52,
		name: 'Infuriate',
		icon: 'https://xivapi.com/i/002000/002555.png',
		cooldown: 60000,
		charges: 2,
		statusesApplied: ['NASCENT_CHAOS'],
	},

	DEFIANCE: {
		id: 48,
		name: 'Defiance',
		icon: 'https://xivapi.com/i/002000/002551.png',
		cooldown: 10000,
		cooldownGroup: 3,
		statusesApplied: ['DEFIANCE'],
	},

	RELEASE_DEFIANCE: SHARED.UNKNOWN, // Added in patch 6.3 layer
})
