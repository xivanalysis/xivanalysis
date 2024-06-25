import {iconUrl} from 'data/icon'
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
		icon: iconUrl(261),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},

	HEAVY_SWING: {
		id: 31,
		name: 'Heavy Swing',
		icon: iconUrl(260),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	MAIM: {
		id: 37,
		name: 'Maim',
		icon: iconUrl(255),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 31,
		},
	},

	STORMS_PATH: {
		id: 42,
		name: 'Storm\'s Path',
		icon: iconUrl(258),
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
		icon: iconUrl(264),
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
		icon: iconUrl(2557),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},

	INNER_CHAOS: {
		id: 16465,
		name: 'Inner Chaos',
		icon: iconUrl(2568),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},

	OVERPOWER: {
		id: 41,
		name: 'Overpower',
		icon: iconUrl(254),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	MYTHRIL_TEMPEST: {
		id: 16462,
		name: 'Mythril Tempest',
		icon: iconUrl(2565),
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
		icon: iconUrl(2558),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},

	CHAOTIC_CYCLONE: {
		id: 16463,
		name: 'Chaotic Cyclone',
		icon: iconUrl(2566),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},

	PRIMAL_REND: {
		id: 25753,
		name: 'Primal Rend',
		icon: iconUrl(2571),
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
		icon: iconUrl(2560),
		cooldown: 60000,
		statusesApplied: ['EQUILIBRIUM'],
	},

	THRILL_OF_BATTLE: {
		id: 40,
		name: 'Thrill of Battle',
		icon: iconUrl(263),
		cooldown: 90000,
		statusesApplied: ['THRILL_OF_BATTLE'],
	},

	HOLMGANG: {
		id: 43,
		name: 'Holmgang',
		icon: iconUrl(266),
		cooldown: 240000,
		statusesApplied: ['HOLMGANG'],
	},

	VENGEANCE: {
		id: 44,
		name: 'Vengeance',
		icon: iconUrl(267),
		cooldown: 120000,
		statusesApplied: ['VENGEANCE'],
	},

	BLOODWHETTING: {
		id: 25751,
		name: 'Bloodwhetting',
		icon: iconUrl(2569),
		cooldown: 25000,
		cooldownGroup: 4,
		statusesApplied: ['BLOODWHETTING', 'STEM_THE_FLOW', 'STEM_THE_TIDE'],
	},

	NASCENT_FLASH: {
		id: 16464,
		name: 'Nascent Flash',
		icon: iconUrl(2567),
		cooldown: 25000,
		cooldownGroup: 4,
		statusesApplied: ['NASCENT_FLASH', 'NASCENT_GLINT', 'STEM_THE_FLOW', 'STEM_THE_TIDE'],
	},

	SHAKE_IT_OFF: {
		id: 7388,
		name: 'Shake It Off',
		icon: iconUrl(2563),
		cooldown: 90000,
		statusesApplied: ['SHAKE_IT_OFF'],
	},

	ONSLAUGHT: {
		id: 7386,
		name: 'Onslaught',
		icon: iconUrl(2561),
		cooldown: 30000,
		charges: 3,
	},

	UPHEAVAL: {
		id: 7387,
		name: 'Upheaval',
		icon: iconUrl(2562),
		cooldown: 30000,
		cooldownGroup: 6,
	},

	OROGENY: {
		id: 25752,
		name: 'Orogeny',
		icon: iconUrl(2570),
		cooldown: 30000,
		cooldownGroup: 6,
	},

	INNER_RELEASE: {
		id: 7389,
		name: 'Inner Release',
		icon: iconUrl(2564),
		cooldown: 60000,
		statusesApplied: ['INNER_RELEASE', 'PRIMAL_REND_READY'],
	},

	INFURIATE: {
		id: 52,
		name: 'Infuriate',
		icon: iconUrl(2555),
		cooldown: 60000,
		charges: 2,
		statusesApplied: ['NASCENT_CHAOS'],
	},

	DEFIANCE: {
		id: 48,
		name: 'Defiance',
		icon: iconUrl(2551),
		cooldown: 10000,
		cooldownGroup: 3,
		statusesApplied: ['DEFIANCE'],
	},

	RELEASE_DEFIANCE: SHARED.UNKNOWN, // Added in patch 6.3 layer
})
