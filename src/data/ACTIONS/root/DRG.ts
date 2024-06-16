import {Attribute} from 'event'
import {ensureActions, BonusModifier} from '../type'

export const DRG = ensureActions({
	// -----
	// Player GCDs
	// -----
	TRUE_THRUST: {
		id: 75,
		name: 'True Thrust',
		icon: 'https://xivapi.com/i/000000/000310.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	VORPAL_THRUST: {
		id: 78,
		name: 'Vorpal Thrust',
		icon: 'https://xivapi.com/i/000000/000312.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [75, 16479],
		},
	},

	// vorpal thrust upgrade
	LANCE_BARRAGE: {
		id: 0, // TODO: ID
		name: 'Lance Barrage',
		icon: '',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [75, 16479],
		},
	},

	PIERCING_TALON: {
		id: 90,
		name: 'Piercing Talon',
		icon: 'https://xivapi.com/i/000000/000315.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},

	FULL_THRUST: {
		id: 84,
		name: 'Full Thrust',
		icon: 'https://xivapi.com/i/000000/000314.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 78,	// TODO: update with lance barrage id number
		},
	},

	HEAVENS_THRUST: {
		id: 25771,
		name: 'Heavens\' Thrust',
		icon: 'https://xivapi.com/i/002000/002595.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 78,
		},
	},

	DISEMBOWEL: {
		id: 87,
		name: 'Disembowel',
		icon: 'https://xivapi.com/i/000000/000317.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [75, 16479],
		},
		statusesApplied: ['POWER_SURGE'],
	},

	// disembowel upgrade
	SPIRAL_BLOW: {
		id: 0, // TODO: actual ID
		name: 'Spiral Blow',
		icon: '',
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
		icon: 'https://xivapi.com/i/000000/000308.png',
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
		icon: 'https://xivapi.com/i/002000/002596.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 87,	// TODO: update with spiral blow id number
		},
		potencies: [{
			value: 100,
			bonusModifiers: [],
		}, {
			value: 140,
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
		id: 0, // TODO: id number
		name: 'Drakesbane',
		icon: '',
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
		icon: 'https://xivapi.com/i/000000/000306.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	DRACONIAN_FURY: {
		id: 25770,
		name: 'Draconian Fury',
		icon: 'https://xivapi.com/i/002000/002594.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	FANG_AND_CLAW: {
		id: 3554,
		name: 'Fang and Claw',
		icon: 'https://xivapi.com/i/002000/002582.png',
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
			from: [84, 25711],
		},
	},

	WHEELING_THRUST: {
		id: 3556,
		name: 'Wheeling Thrust',
		icon: 'https://xivapi.com/i/002000/002584.png',
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
			from: [88, 25722],
		},
	},

	RAIDEN_THRUST: {
		id: 16479,
		name: 'Raiden Thrust',
		icon: 'https://xivapi.com/i/002000/002592.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	SONIC_THRUST: {
		id: 7397,
		name: 'Sonic Thrust',
		icon: 'https://xivapi.com/i/002000/002586.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [86, 25770],
		},
	},

	COERTHAN_TORMENT: {
		id: 16477,
		name: 'Coerthan Torment',
		icon: 'https://xivapi.com/i/002000/002590.png',
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
		icon: 'https://xivapi.com/i/000000/000304.png',
		cooldown: 40000,
		statusesApplied: ['LIFE_SURGE'],
		charges: 2,
	},

	LANCE_CHARGE: {
		id: 85,
		name: 'Lance Charge',
		icon: 'https://xivapi.com/i/000000/000309.png',
		cooldown: 60000,
		statusesApplied: ['LANCE_CHARGE'],
	},

	JUMP: {
		id: 92,
		name: 'Jump',
		icon: 'https://xivapi.com/i/002000/002576.png',
		cooldown: 30000,
		statusesApplied: ['DIVE_READY'],
	},

	HIGH_JUMP: {
		id: 16478,
		name: 'High Jump',
		icon: 'https://xivapi.com/i/002000/002591.png',
		cooldown: 30000,
		statusesApplied: ['DIVE_READY'],
	},

	ELUSIVE_JUMP: {
		id: 94,
		name: 'Elusive Jump',
		icon: 'https://xivapi.com/i/002000/002577.png',
		cooldown: 30000,
	},

	DRAGONFIRE_DIVE: {
		id: 96,
		name: 'Dragonfire Dive',
		icon: 'https://xivapi.com/i/002000/002578.png',
		cooldown: 120000,
		statusesApplied: ['DRAGONS_FLIGHT'],
	},

	RISE_OF_THE_DRAGON: {
		id: 0, // TODO: actual Id
		name: 'Rise of the Dragon',
		icon: '',
		cooldown: 1000,
	},

	BATTLE_LITANY: {
		id: 3557,
		name: 'Battle Litany',
		icon: 'https://xivapi.com/i/002000/002585.png',
		cooldown: 120000,
		statusesApplied: ['BATTLE_LITANY'],
	},

	GEIRSKOGUL: {
		id: 3555,
		name: 'Geirskogul',
		icon: 'https://xivapi.com/i/002000/002583.png',
		cooldown: 30000,
		statusesApplied: ['NASTROND_READY'],
	},

	MIRAGE_DIVE: {
		id: 7399,
		name: 'Mirage Dive',
		icon: 'https://xivapi.com/i/002000/002588.png',
		cooldown: 1000,
	},

	NASTROND: {
		id: 7400,
		name: 'Nastrond',
		icon: 'https://xivapi.com/i/002000/002589.png',
		cooldown: 10000,
	},

	STARDIVER: {
		id: 16480,
		name: 'Stardiver',
		icon: 'https://xivapi.com/i/002000/002593.png',
		cooldown: 30000,
		statusesApplied: ['STARCROSS_READY'],
	},

	STARCROSS: {
		id: 0, // TODO: actual id,
		name: 'Starcross',
		icon: '',
		cooldown: 1000,
	},

	WYRMWIND_THRUST: {
		id: 25773,
		name: 'Wyrmwind Thrust',
		icon: 'https://xivapi.com/i/002000/002597.png',
		cooldown: 10000,
	},

	WINGED_GLIDE: {
		id: 0, // TODO: actual id
		name: 'Winged Glide',
		charges: 2,
		icon: '',
		cooldown: 60000,
	},
})
