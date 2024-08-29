import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions, BonusModifier} from '../type'

export const DRG = ensureActions({
	// -----
	// Player GCDs
	// -----
	TRUE_THRUST: {
		id: 75,
		name: 'True Thrust',
		icon: iconUrl(310),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	VORPAL_THRUST: {
		id: 78,
		name: 'Vorpal Thrust',
		icon: iconUrl(312),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [75, 16479],
		},
	},

	// vorpal thrust upgrade
	LANCE_BARRAGE: {
		id: 36954,
		name: 'Lance Barrage',
		icon: iconUrl(2076),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [75, 16479],
		},
	},

	PIERCING_TALON: {
		id: 90,
		name: 'Piercing Talon',
		icon: iconUrl(315),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},

	FULL_THRUST: {
		id: 84,
		name: 'Full Thrust',
		icon: iconUrl(314),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [78, 36954],
		},
	},

	HEAVENS_THRUST: {
		id: 25771,
		name: 'Heavens\' Thrust',
		icon: iconUrl(2595),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [78, 36954],
		},
	},

	DISEMBOWEL: {
		id: 87,
		name: 'Disembowel',
		icon: iconUrl(317),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [75, 16479],
		},
		statusesApplied: ['POWER_SURGE'],
	},

	// disembowel upgrade
	SPIRAL_BLOW: {
		id: 36955,
		name: 'Spiral Blow',
		icon: iconUrl(2077),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [75, 16479],
		},
		statusesApplied: ['POWER_SURGE'],
	},

	CHAOS_THRUST: {
		id: 88,
		name: 'Chaos Thrust',
		icon: iconUrl(308),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 87,
		},
		statusesApplied: ['CHAOS_THRUST'],
	},

	CHAOTIC_SPRING: {
		id: 25772,
		name: 'Chaotic Spring',
		icon: iconUrl(2596),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [87, 36955],
		},
		potencies: [{
			value: 140,
			bonusModifiers: [],
		}, {
			value: 180,
			bonusModifiers: [BonusModifier.POSITIONAL],
		}, {
			value: 300,
			bonusModifiers: [BonusModifier.COMBO],
		}, {
			value: 340,
			bonusModifiers: [BonusModifier.COMBO, BonusModifier.POSITIONAL],
		}],
		statusesApplied: ['CHAOTIC_SPRING'],
	},

	// new combo finisher
	DRAKESBANE: {
		id: 36952,
		name: 'Drakesbane',
		icon: iconUrl(2599),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [3554, 3556],
			end: true,
		},
		potencies: [{
			value: 440,
			bonusModifiers: [],
		}],
		statusesApplied: ['DRACONIAN_FIRE'],
	},

	DOOM_SPIKE: {
		id: 86,
		name: 'Doom Spike',
		icon: iconUrl(306),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	DRACONIAN_FURY: {
		id: 25770,
		name: 'Draconian Fury',
		icon: iconUrl(2594),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	FANG_AND_CLAW: {
		id: 3554,
		name: 'Fang and Claw',
		icon: iconUrl(2582),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potencies: [{
			value: 140,
			bonusModifiers: [],
			baseModifiers: [],
		}, {
			value: 180,
			bonusModifiers: [BonusModifier.POSITIONAL],
			baseModifiers: [],
		}, {
			value: 300,
			bonusModifiers: [BonusModifier.COMBO],
		}, {
			value: 340,
			bonusModifiers: [BonusModifier.POSITIONAL, BonusModifier.COMBO],
		}],
		combo: {
			from: [84, 25771],
		},
	},

	WHEELING_THRUST: {
		id: 3556,
		name: 'Wheeling Thrust',
		icon: iconUrl(2584),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potencies: [{
			value: 140,
			bonusModifiers: [],
			baseModifiers: [],
		}, {
			value: 180,
			bonusModifiers: [BonusModifier.POSITIONAL],
			baseModifiers: [],
		}, {
			value: 300,
			bonusModifiers: [BonusModifier.COMBO],
		}, {
			value: 340,
			bonusModifiers: [BonusModifier.POSITIONAL, BonusModifier.COMBO],
		}],
		combo: {
			from: [88, 25772],
		},
	},

	RAIDEN_THRUST: {
		id: 16479,
		name: 'Raiden Thrust',
		icon: iconUrl(2592),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	SONIC_THRUST: {
		id: 7397,
		name: 'Sonic Thrust',
		icon: iconUrl(2586),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [86, 25770],
		},
	},

	COERTHAN_TORMENT: {
		id: 16477,
		name: 'Coerthan Torment',
		icon: iconUrl(2590),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 7397,
			end: true,
		},
		statusesApplied: ['DRACONIAN_FIRE'],
	},

	// -----
	// Player OGCDs
	// -----
	LIFE_SURGE: {
		id: 83,
		name: 'Life Surge',
		icon: iconUrl(304),
		cooldown: 40000,
		statusesApplied: ['LIFE_SURGE'],
		charges: 2,
	},

	LANCE_CHARGE: {
		id: 85,
		name: 'Lance Charge',
		icon: iconUrl(309),
		cooldown: 60000,
		statusesApplied: ['LANCE_CHARGE'],
	},

	JUMP: {
		id: 92,
		name: 'Jump',
		icon: iconUrl(2576),
		cooldown: 30000,
		statusesApplied: ['DIVE_READY'],
	},

	HIGH_JUMP: {
		id: 16478,
		name: 'High Jump',
		icon: iconUrl(2591),
		cooldown: 30000,
		statusesApplied: ['DIVE_READY'],
	},

	ELUSIVE_JUMP: {
		id: 94,
		name: 'Elusive Jump',
		icon: iconUrl(2577),
		cooldown: 30000,
	},

	SPINESHATTER_DIVE: {
		id: 95,
		name: 'Spineshatter Dive',
		icon: iconUrl(2580),
		cooldown: 60000,
		charges: 2,
	},

	DRAGONFIRE_DIVE: {
		id: 96,
		name: 'Dragonfire Dive',
		icon: iconUrl(2578),
		cooldown: 120000,
		statusesApplied: ['DRAGONS_FLIGHT'],
	},

	RISE_OF_THE_DRAGON: {
		id: 36953,
		name: 'Rise of the Dragon',
		icon: iconUrl(2075),
		cooldown: 1000,
	},

	BATTLE_LITANY: {
		id: 3557,
		name: 'Battle Litany',
		icon: iconUrl(2585),
		cooldown: 120000,
		statusesApplied: ['BATTLE_LITANY'],
	},

	GEIRSKOGUL: {
		id: 3555,
		name: 'Geirskogul',
		icon: iconUrl(2583),
		cooldown: 60000,
		statusesApplied: ['NASTROND_READY'],
	},

	MIRAGE_DIVE: {
		id: 7399,
		name: 'Mirage Dive',
		icon: iconUrl(2588),
		cooldown: 1000,
	},

	NASTROND: {
		id: 7400,
		name: 'Nastrond',
		icon: iconUrl(2589),
		cooldown: 10000,
	},

	STARDIVER: {
		id: 16480,
		name: 'Stardiver',
		icon: iconUrl(2593),
		cooldown: 30000,
		statusesApplied: ['STARCROSS_READY'],
		potencies: [{
			value: 620,
			bonusModifiers: [],
		}],
	},

	STARCROSS: {
		id: 36956,
		name: 'Starcross',
		icon: iconUrl(2078),
		cooldown: 1000,
		potencies: [{
			value: 700,
			bonusModifiers: [],
		}],
	},

	WYRMWIND_THRUST: {
		id: 25773,
		name: 'Wyrmwind Thrust',
		icon: iconUrl(2597),
		cooldown: 10000,
	},

	WINGED_GLIDE: {
		id: 36951,
		name: 'Winged Glide',
		charges: 2,
		icon: iconUrl(2598),
		cooldown: 60000,
	},
})
