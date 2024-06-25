import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions, BonusModifier} from '../type'

export const MNK = ensureActions({
	// -----
	// Player GCDs
	// -----

	BOOTSHINE: {
		id: 53,
		name: 'Bootshine',
		icon: iconUrl(208),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potencies: [{
			value: 210,
			bonusModifiers: [],
		}, {
			value: 310,
			bonusModifiers: [],
			baseModifiers: ['LEADEN_FIST'],
		}],
	},

	TRUE_STRIKE: {
		id: 54,
		name: 'True Strike',
		icon: iconUrl(209),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potencies: [{
			value: 300,
			bonusModifiers: [],
		}],
	},

	SNAP_PUNCH: {
		id: 56,
		name: 'Snap Punch',
		icon: iconUrl(210),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potencies: [{
			value: 250,
			bonusModifiers: [],
		}, {
			value: 310,
			bonusModifiers: [BonusModifier.POSITIONAL],
		}],
	},

	TWIN_SNAKES: {
		id: 61,
		name: 'Twin Snakes',
		icon: iconUrl(213),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['DISCIPLINED_FIST'],
		potencies: [{
			value: 280,
			bonusModifiers: [],
		}],
	},

	ARM_OF_THE_DESTROYER: {
		id: 62,
		name: 'Arm of the Destroyer',
		icon: iconUrl(215),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	SHADOW_OF_THE_DESTROYER: {
		id: 25767,
		name: 'Shadow of the Destroyer',
		icon: iconUrl(215),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	DEMOLISH: {
		id: 66,
		name: 'Demolish',
		icon: iconUrl(204),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['DEMOLISH'],
		potencies: [{
			value: 70,
			bonusModifiers: [],
		}, {
			value: 130,
			bonusModifiers: [BonusModifier.POSITIONAL],
		}],
	},

	ROCKBREAKER: {
		id: 70,
		name: 'Rockbreaker',
		icon: iconUrl(2529),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	DRAGON_KICK: {
		id: 74,
		name: 'Dragon Kick',
		icon: iconUrl(2528),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	FORM_SHIFT: {
		id: 4262,
		name: 'Form Shift',
		icon: iconUrl(2536),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['FORMLESS_FIST'],
	},

	MEDITATION: {
		id: 3546,
		name: 'Meditation',
		icon: iconUrl(2534),
		onGcd: true,
		cooldown: 1000,
	},

	FOUR_POINT_FURY: {
		id: 16473,
		name: 'Four-Point Fury',
		icon: iconUrl(2544),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	SIX_SIDED_STAR: {
		id: 16476,
		name: 'Six-Sided Star',
		icon: iconUrl(2547),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 5000,
	},

	// -----
	// Masterful Blitz GCDs
	// -----

	MASTERFUL_BLITZ: {
		id: 25764,
		name: 'Masterful Blitz',
		icon: iconUrl(2976),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	ELIXIR_FIELD: {
		id: 3545,
		name: 'Elixir Field',
		icon: iconUrl(2533),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['FORMLESS_FIST'],
		potencies: [{
			value: 600,
			bonusModifiers: [],
		}],
	},

	FLINT_STRIKE: {
		id: 25882,
		name: 'Flint Strike',
		icon: iconUrl(2548),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['FORMLESS_FIST'],
		potency: 600,
	},

	CELESTIAL_REVOLUTION: {
		id: 25765,
		name: 'Celestial Revolution',
		icon: iconUrl(2977),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['FORMLESS_FIST'],
		potencies: [{
			value: 450,
			bonusModifiers: [],
		}],
	},

	TORNADO_KICK: {
		id: 3543,
		name: 'Tornado Kick',
		icon: iconUrl(2531),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['FORMLESS_FIST'],
		potency: 850,
	},

	RISING_PHOENIX: {
		id: 25768,
		name: 'Rising Phoenix',
		icon: iconUrl(2980),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['FORMLESS_FIST'],
		potencies: [{
			value: 700,
			bonusModifiers: [],
		}],
	},

	PHANTOM_RUSH: {
		id: 25769,
		name: 'Phantom Rush',
		icon: iconUrl(2981),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['FORMLESS_FIST'],
	},

	// -----
	// Player OGCDs
	// -----

	MANTRA: {
		id: 65,
		name: 'Mantra',
		icon: iconUrl(216),
		cooldown: 90000,
		statusesApplied: ['MANTRA'],
	},

	PERFECT_BALANCE: {
		id: 69,
		name: 'Perfect Balance',
		icon: iconUrl(217),
		cooldown: 40000,
		charges: 2,
		statusesApplied: ['PERFECT_BALANCE'],
	},

	BROTHERHOOD: {
		id: 7396,
		name: 'Brotherhood',
		icon: iconUrl(2542),
		cooldown: 120000,
		statusesApplied: ['BROTHERHOOD', 'MEDITATIVE_BROTHERHOOD'],
	},

	RIDDLE_OF_EARTH: {
		id: 7394,
		name: 'Riddle of Earth',
		icon: iconUrl(2537),
		charges: 3,
		cooldown: 30000,
		statusesApplied: ['RIDDLE_OF_EARTH'],
	},

	RIDDLE_OF_FIRE: {
		id: 7395,
		name: 'Riddle of Fire',
		icon: iconUrl(2541),
		cooldown: 60000,
		statusesApplied: ['RIDDLE_OF_FIRE'],
	},

	RIDDLE_OF_WIND: {
		id: 25766,
		name: 'Riddle of Wind',
		icon: iconUrl(2978),
		cooldown: 90000,
		statusesApplied: ['RIDDLE_OF_WIND'],
	},

	STEEL_PEAK: {
		id: 25761,
		name: 'Steel Peak',
		icon: iconUrl(2530),
		cooldown: 1000,
		cooldownGroup: 1,
	},

	HOWLING_FIST: {
		id: 25763,
		name: 'Howling Fist',
		icon: iconUrl(207),
		cooldown: 1000,
		cooldownGroup: 1,
	},

	THE_FORBIDDEN_CHAKRA: {
		id: 3547,
		name: 'The Forbidden Chakra',
		icon: iconUrl(2535),
		cooldown: 1000,
		cooldownGroup: 1,
	},

	ENLIGHTENMENT: {
		id: 16474,
		name: 'Enlightenment',
		icon: iconUrl(2545),
		cooldown: 1000,
		cooldownGroup: 1,
	},

	ANATMAN: {
		id: 16475,
		name: 'Anatman',
		icon: iconUrl(2546),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 60000,
		gcdRecast: 2500,
		statusesApplied: ['ANATMAN'],
	},

	THUNDERCLAP: {
		id: 25762,
		name: 'Thunderclap',
		icon: iconUrl(2975),
		cooldown: 30000,
		charges: 3,
	},
})
