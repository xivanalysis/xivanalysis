import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions, BonusModifier, PotencySpecialCase} from '../type'

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
			value: 220,
			bonusModifiers: [],
		}, {
			value: 420,
			bonusModifiers: [],
			baseModifiers: [PotencySpecialCase.MNK_OPO_OPOS_FURY],
		}],
	},

	TRUE_STRIKE: {
		id: 54,
		name: 'True Strike',
		icon: iconUrl(209),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potencies: [{
			value: 290,
			bonusModifiers: [],
		}, {
			value: 440,
			bonusModifiers: [],
			baseModifiers: [PotencySpecialCase.MNK_RAPTORS_FURY],
		}],
	},

	SNAP_PUNCH: {
		id: 56,
		name: 'Snap Punch',
		icon: iconUrl(210),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potencies: [{
			value: 300,
			bonusModifiers: [],
		}, {
			value: 360,
			bonusModifiers: [BonusModifier.POSITIONAL],
		}, {
			value: 400,
			bonusModifiers: [],
			baseModifiers: [PotencySpecialCase.MNK_COEURLS_FURY],
		}, {
			value: 460,
			bonusModifiers: [BonusModifier.POSITIONAL],
			baseModifiers: [PotencySpecialCase.MNK_COEURLS_FURY],
		}],
	},

	TWIN_SNAKES: {
		id: 61,
		name: 'Twin Snakes',
		icon: iconUrl(213),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potencies: [{
			value: 380,
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
		icon: iconUrl(2979),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	DEMOLISH: {
		id: 66,
		name: 'Demolish',
		icon: iconUrl(204),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potencies: [{
			value: 340,
			bonusModifiers: [],
		}, {
			value: 400,
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

	FOUR_POINT_FURY: {
		id: 16473,
		name: 'Four-Point Fury',
		icon: iconUrl(2544),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	SIX_SIDED_STAR: {
		id: 16476,
		name: 'Six-sided Star',
		icon: iconUrl(2547),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		gcdRecast: 5000,
		statusesApplied: ['SIX_SIDED_STAR'],
	},

	LEAPING_OPO: {
		id: 36945,
		name: 'Leaping Opo',
		icon: iconUrl(2982),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potencies: [{
			value: 260,
			bonusModifiers: [],
		}, {
			value: 460,
			bonusModifiers: [],
			baseModifiers: [PotencySpecialCase.MNK_OPO_OPOS_FURY],
		}],
	},

	RISING_RAPTOR: {
		id: 36946,
		name: 'Rising Raptor',
		icon: iconUrl(2983),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potencies: [{
			value: 330,
			bonusModifiers: [],
		}, {
			value: 480,
			bonusModifiers: [],
			baseModifiers: [PotencySpecialCase.MNK_RAPTORS_FURY],
		}],
	},

	POUNCING_COEURL: {
		id: 36947,
		name: 'Pouncing Coeurl',
		icon: iconUrl(2984),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potencies: [{
			value: 340,
			bonusModifiers: [],
		}, {
			value: 400,
			bonusModifiers: [BonusModifier.POSITIONAL],
		}, {
			value: 440,
			bonusModifiers: [],
			baseModifiers: [PotencySpecialCase.MNK_COEURLS_FURY],
		}, {
			value: 500,
			bonusModifiers: [BonusModifier.POSITIONAL],
			baseModifiers: [PotencySpecialCase.MNK_COEURLS_FURY],
		}],
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
			value: 800,
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
		potencies: [{
			value: 600,
			bonusModifiers: [],
		}],
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
		potencies: [{
			value: 850,
			bonusModifiers: [],
		}],
	},

	RISING_PHOENIX: {
		id: 25768,
		name: 'Rising Phoenix',
		icon: iconUrl(2980),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['FORMLESS_FIST'],
		potencies: [{
			value: 900,
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
		potencies: [{
			value: 1400,
			bonusModifiers: [],
		}],
	},

	ELIXIR_BURST: {
		id: 36948,
		name: 'Elixir Burst',
		icon: iconUrl(2985),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['FORMLESS_FIST'],
		potencies: [{
			value: 900,
			bonusModifiers: [],
		}],
	},

	// -----
	// Reply GCDs
	// -----

	WINDS_REPLY: {
		id: 36949,
		name: "Wind's Reply",
		icon: iconUrl(2986),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potencies: [{
			value: 800,
			bonusModifiers: [],
		}],
	},

	FIRES_REPLY: {
		id: 36950,
		name: "Fire's Reply",
		icon: iconUrl(2987),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['FORMLESS_FIST'],
		potencies: [{
			value: 1100,
			bonusModifiers: [],
		}],
	},

	// -----
	// Meditations (Monkus Aurelius)
	// -----

	STEELED_MEDITATION: {
		id: 36940,
		name: 'Steeled Meditation',
		icon: iconUrl(218),
		onGcd: true,
		cooldown: 1000,
	},

	FORBIDDEN_MEDITATION: {
		id: 36942,
		name: 'Forbidden Meditation',
		icon: iconUrl(218),
		onGcd: true,
		cooldown: 1000,
	},

	ENLIGHTENED_MEDITATION: {
		id: 36943,
		name: 'Enlightened Meditation',
		icon: iconUrl(219),
		onGcd: true,
		cooldown: 1000,
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
		cooldown: 120000,
		statusesApplied: ['RIDDLE_OF_EARTH', 'EARTHS_RUMINATION'],
	},

	RIDDLE_OF_FIRE: {
		id: 7395,
		name: 'Riddle of Fire',
		icon: iconUrl(2541),
		cooldown: 60000,
		statusesApplied: ['RIDDLE_OF_FIRE', 'FIRES_RUMINATION'],
	},

	RIDDLE_OF_WIND: {
		id: 25766,
		name: 'Riddle of Wind',
		icon: iconUrl(2978),
		cooldown: 90000,
		statusesApplied: ['RIDDLE_OF_WIND', 'WINDS_RUMINATION'],
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

	THUNDERCLAP: {
		id: 25762,
		name: 'Thunderclap',
		icon: iconUrl(2975),
		cooldown: 30000,
		charges: 3,
	},

	EARTHS_REPLY: {
		id: 36944,
		name: "Earth's Reply",
		icon: iconUrl(2549),
		statusesApplied: ['EARTHS_REPLY'],
	},
})
