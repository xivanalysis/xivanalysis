import {Attribute} from 'event'
import {ensureActions} from '../type'

export const MNK = ensureActions({
	// -----
	// Player GCDs
	// -----

	BOOTSHINE: {
		id: 53,
		name: 'Bootshine',
		icon: 'https://xivapi.com/i/000000/000208.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 210,
	},

	TRUE_STRIKE: {
		id: 54,
		name: 'True Strike',
		icon: 'https://xivapi.com/i/000000/000209.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 300,
	},

	SNAP_PUNCH: {
		id: 56,
		name: 'Snap Punch',
		icon: 'https://xivapi.com/i/000000/000210.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	TWIN_SNAKES: {
		id: 61,
		name: 'Twin Snakes',
		icon: 'https://xivapi.com/i/000000/000213.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 280,
		statusesApplied: ['DISCIPLINED_FIST'],
	},

	ARM_OF_THE_DESTROYER: {
		id: 62,
		name: 'Arm of the Destroyer',
		icon: 'https://xivapi.com/i/000000/000215.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	DEMOLISH: {
		id: 66,
		name: 'Demolish',
		icon: 'https://xivapi.com/i/000000/000204.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['DEMOLISH'],
	},

	ROCKBREAKER: {
		id: 70,
		name: 'Rockbreaker',
		icon: 'https://xivapi.com/i/002000/002529.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	DRAGON_KICK: {
		id: 74,
		name: 'Dragon Kick',
		icon: 'https://xivapi.com/i/002000/002528.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	FORM_SHIFT: {
		id: 4262,
		name: 'Form Shift',
		icon: 'https://xivapi.com/i/002000/002536.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	MEDITATION: {
		id: 3546,
		name: 'Meditation',
		icon: 'https://xivapi.com/i/002000/002534.png',
		onGcd: true,
		cooldown: 1.2,
	},

	FOUR_POINT_FURY: {
		id: 16473,
		name: 'Four-Point Fury',
		icon: 'https://xivapi.com/i/002000/002544.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	SIX_SIDED_STAR: {
		id: 16476,
		name: 'Six-Sided Star',
		icon: 'https://xivapi.com/i/002000/002547.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 5000,
	},

	// -----
	// Player OGCDs
	// -----

	MANTRA: {
		id: 65,
		name: 'Mantra',
		icon: 'https://xivapi.com/i/000000/000216.png',
		cooldown: 90000,
		statusesApplied: ['MANTRA'],
	},

	PERFECT_BALANCE: {
		id: 69,
		name: 'Perfect Balance',
		icon: 'https://xivapi.com/i/000000/000217.png',
		cooldown: 40000,
		charges: 2,
		statusesApplied: ['PERFECT_BALANCE'],
	},

	THUNDERCLAP: {
		id: 25762,
		name: 'Thunderclap',
		icon: 'https://xivapi.com/i/002000/002975.png',
		cooldown: 30000,
		charges: 3,
	},

	THE_FORBIDDEN_CHAKRA: {
		id: 3547,
		name: 'The Forbidden Chakra',
		icon: 'https://xivapi.com/i/002000/002535.png',
		cooldown: 1000,
		cooldownGroup: 1,
	},

	ELIXIR_FIELD: {
		id: 3545,
		name: 'Elixir Field',
		icon: 'https://xivapi.com/i/002000/002533.png',
		cooldown: 30000,
	},

	TORNADO_KICK: {
		id: 3543,
		name: 'Tornado Kick',
		icon: 'https://xivapi.com/i/002000/002531.png',
		cooldown: 45000,
	},

	RIDDLE_OF_EARTH: {
		id: 7394,
		name: 'Riddle of Earth',
		icon: 'https://xivapi.com/i/002000/002537.png',
		charges: 3,
		cooldown: 30000,
		statusesApplied: ['RIDDLE_OF_EARTH'],
	},

	RIDDLE_OF_FIRE: {
		id: 7395,
		name: 'Riddle of Fire',
		icon: 'https://xivapi.com/i/002000/002541.png',
		cooldown: 60000,
		statusesApplied: ['RIDDLE_OF_FIRE'],
	},

	BROTHERHOOD: {
		id: 7396,
		name: 'Brotherhood',
		icon: 'https://xivapi.com/i/002000/002542.png',
		cooldown: 120000,
		statusesApplied: ['BROTHERHOOD', 'MEDITATIVE_BROTHERHOOD'],
	},

	ENLIGHTENMENT: {
		id: 16474,
		name: 'Enlightenment',
		icon: 'https://xivapi.com/i/002000/002545.png',
		cooldown: 1000,
		cooldownGroup: 1,
	},

	ANATMAN: {
		id: 16475,
		name: 'Anatman',
		icon: 'https://xivapi.com/i/002000/002546.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 60000,
		gcdRecast: 2500,
		statusesApplied: ['ANATMAN'],
	},

	RIDDLE_OF_WIND: {
		id: 25766,
		name: 'Riddle of Wind',
		icon: 'https://xivapi.com/i/002000/002978.png',
		cooldown: 90000,
		statusesApplied: ['RIDDLE_OF_WIND'],
	},
})
