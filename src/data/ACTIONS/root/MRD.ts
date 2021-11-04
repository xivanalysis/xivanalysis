import {Attribute} from 'event'
import {ensureActions} from '../type'

// Split between MRD and WAR
export const MRD = ensureActions({
	// -----
	// Player GCDs
	// -----
	HEAVY_SWING: {
		id: 31,
		name: 'Heavy Swing',
		icon: 'https://xivapi.com/i/000000/000260.png',
		potency: 200,
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	OVERPOWER: {
		id: 41,
		name: 'Overpower',
		icon: 'https://xivapi.com/i/000000/000254.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 130,
		combo: {
			start: true,
		},
	},

	TOMAHAWK: {
		id: 46,
		name: 'Tomahawk',
		icon: 'https://xivapi.com/i/000000/000261.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 140,
		breaksCombo: true,
	},

	MAIM: {
		id: 37,
		name: 'Maim',
		icon: 'https://xivapi.com/i/000000/000255.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 100,
		combo: {
			from: 31,
			potency: 320,
		},
	},

	STORMS_PATH: {
		id: 42,
		name: 'Storm\'s Path',
		icon: 'https://xivapi.com/i/000000/000258.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 100,
		combo: {
			from: 37,
			potency: 420,
			end: true,
		},
	},

	STORMS_EYE: {
		id: 45,
		name: 'Storm\'s Eye',
		icon: 'https://xivapi.com/i/000000/000264.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 100,
		combo: {
			from: 37,
			potency: 420,
			end: true,
		},
		statusesApplied: ['STORMS_EYE'],
	},

	// -----
	// Player OGCDs
	// -----

	THRILL_OF_BATTLE: {
		id: 40,
		name: 'Thrill of Battle',
		icon: 'https://xivapi.com/i/000000/000263.png',
		cooldown: 90000,
		onGcd: false,
		statusesApplied: ['THRILL_OF_BATTLE'],
	},

	HOLMGANG: {
		id: 43,
		name: 'Holmgang',
		icon: 'https://xivapi.com/i/000000/000266.png',
		cooldown: 240000,
		onGcd: false,
		statusesApplied: ['HOLMGANG'],
	},

	VENGEANCE: {
		id: 44,
		name: 'Vengeance',
		icon: 'https://xivapi.com/i/000000/000267.png',
		cooldown: 120000,
		onGcd: false,
		statusesApplied: ['VENGEANCE'],
	},
})
