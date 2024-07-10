import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions} from '../type'

export const PCT_COOLDOWN_GROUPS = {
	LIVING_MUSE: 19,
	MOG_OF_THE_AGES: 7,
	STEEL_MUSE: 20,
	SCENIC_MUSE: 21,
}

export const PCT = ensureActions({
	/** Single-target Astral aspected spells */
	FIRE_IN_RED: {
		id: 34650,
		name: 'Fire in Red',
		icon: iconUrl(3801),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 300,
		statusesApplied: ['AETHERHUES'],
	},
	AERO_IN_GREEN: {
		id: 34651,
		name: 'Aero in Green',
		icon: iconUrl(3802),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 300,
		statusesApplied: ['AETHERHUES_II'],
	},
	WATER_IN_BLUE: {
		id: 34652,
		name: 'Water in Blue',
		icon: iconUrl(3803),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 300,
	},

	/** AoE Astral aspected spells */
	FIRE_II_IN_RED: {
		id: 34656,
		name: 'Fire II in Red',
		icon: iconUrl(3807),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 300,
		statusesApplied: ['AETHERHUES'],
	},
	AERO_II_IN_GREEN: {
		id: 34657,
		name: 'Aero II in Green',
		icon: iconUrl(3808),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 300,
		statusesApplied: ['AETHERHUES_II'],
	},
	WATER_II_IN_BLUE: {
		id: 34658,
		name: 'Water II in Blue',
		icon: iconUrl(3809),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 300,
	},
	HOLY_IN_WHITE: {
		id: 34662,
		name: 'Holy in White',
		icon: iconUrl(3813),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		mpCost: 200,
	},

	/** Single-target Umbral aspected spells */
	BLIZZARD_IN_CYAN: {
		id: 34653,
		name: 'Blizzard in Cyan',
		icon: iconUrl(3804),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2300,
		gcdRecast: 3300,
		mpCost: 300,
		statusesApplied: ['AETHERHUES'],
	},
	STONE_IN_YELLOW: {
		id: 34654,
		name: 'Stone in Yellow',
		icon: iconUrl(3805),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2300,
		gcdRecast: 3300,
		mpCost: 300,
		statusesApplied: ['AETHERHUES_II'],
	},
	THUNDER_IN_MAGENTA: {
		id: 34655,
		name: 'Thunder in Magenta',
		icon: iconUrl(3806),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2300,
		gcdRecast: 3300,
		mpCost: 300,
	},

	/** AoE Umbral aspected spells */
	BLIZZARD_II_IN_CYAN: {
		id: 34659,
		name: 'Blizzard II in Cyan',
		icon: iconUrl(3810),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2300,
		gcdRecast: 3300,
		mpCost: 400,
		statusesApplied: ['AETHERHUES'],
	},
	STONE_II_IN_YELLOW: {
		id: 34660,
		name: 'Stone II in Yellow',
		icon: iconUrl(3811),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2300,
		gcdRecast: 3300,
		mpCost: 400,
		statusesApplied: ['AETHERHUES_II'],
	},
	THUNDER_II_IN_MAGENTA: {
		id: 34661,
		name: 'Thunder II in Magenta',
		icon: iconUrl(3812),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2300,
		gcdRecast: 3300,
		mpCost: 400,
	},
	COMET_IN_BLACK: {
		id: 34663,
		name: 'Comet in Black',
		icon: iconUrl(3814),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		gcdRecast: 3300,
		mpCost: 300,
	},

	/** Unaspected spells */
	RAINBOW_DRIP: {
		id: 34688,
		name: 'Rainbow Drip',
		icon: iconUrl(3838),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 4000,
		gcdRecast: 6000,
	},
	STAR_PRISM: {
		id: 34681,
		name: 'Star Prism',
		icon: iconUrl(3832),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	// Star prism appears to have a cure 'action' like Pneuma
	STAR_PRISM_CURE: {
		id: 34682,
		name: 'Star Prism',
		icon: iconUrl(3832), // Technically it uses the default cure icon but w/e
	},

	/** Creature canvas spells */
	CREATURE_MOTIF: {
		id: 34689,
		name: 'Creature Motif',
		icon: iconUrl(3839),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 4000,
	},
	POM_MOTIF: {
		id: 34664,
		name: 'Pom Motif',
		icon: iconUrl(3815),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 4000,
	},
	WING_MOTIF: {
		id: 34665,
		name: 'Wing Motif',
		icon: iconUrl(3816),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 4000,
	},
	CLAW_MOTIF: {
		id: 34666,
		name: 'Claw Motif',
		icon: iconUrl(3817),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 4000,
	},
	MAW_MOTIF: {
		id: 34667,
		name: 'Maw Motif',
		icon: iconUrl(3818),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 4000,
	},

	/** Creature canvas abilites */
	LIVING_MUSE: {
		id: 35347,
		name: 'Living Muse',
		icon: iconUrl(3842),
		cooldown: 40000,
		charges: 3,
		cooldownGroup: PCT_COOLDOWN_GROUPS.LIVING_MUSE,
	},
	POM_MUSE: {
		id: 34670,
		name: 'Pom Muse',
		icon: iconUrl(3821),
		cooldown: 40000,
		charges: 3,
		cooldownGroup: PCT_COOLDOWN_GROUPS.LIVING_MUSE,
	},
	WINGED_MUSE: {
		id: 34671,
		name: 'Winged Muse',
		icon: iconUrl(3822),
		cooldown: 40000,
		charges: 3,
		cooldownGroup: PCT_COOLDOWN_GROUPS.LIVING_MUSE,
	},
	MOG_OF_THE_AGES: {
		id: 34676,
		name: 'Mog of the Ages',
		icon: iconUrl(3827),
		cooldown: 30000,
		cooldownGroup: PCT_COOLDOWN_GROUPS.MOG_OF_THE_AGES,
	},
	CLAWED_MUSE: {
		id: 34672,
		name: 'Clawed Muse',
		icon: iconUrl(3823),
		cooldown: 40000,
		charges: 3,
		cooldownGroup: PCT_COOLDOWN_GROUPS.LIVING_MUSE,
	},
	FANGED_MUSE: {
		id: 34673,
		name: 'Fanged Muse',
		icon: iconUrl(3824),
		cooldown: 40000,
		charges: 3,
		cooldownGroup: PCT_COOLDOWN_GROUPS.LIVING_MUSE,
	},
	RETRIBUTION_OF_THE_MADEEN: {
		id: 34677,
		name: 'Mog of the Ages',
		icon: iconUrl(3828),
		cooldown: 30000,
		cooldownGroup: PCT_COOLDOWN_GROUPS.MOG_OF_THE_AGES,
	},

	/** Weapon canvas spells */
	WEAPON_MOTIF: {
		id: 34690,
		name: 'Weapon Motif',
		icon: iconUrl(3840),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 4000,
	},
	HAMMER_MOTIF: {
		id: 34668,
		name: 'Hammer Motif',
		icon: iconUrl(3819),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 4000,
	},
	HAMMER_STAMP: {
		id: 34678,
		name: 'Hammer Stamp',
		icon: iconUrl(3829),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	HAMMER_BRUSH: {
		id: 34679,
		name: 'Hammer Brush',
		icon: iconUrl(3830),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	POLISHING_HAMMER: {
		id: 34680,
		name: 'Polishing Hammer',
		icon: iconUrl(3831),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	/** Weapon canvas abilites */
	STEEL_MUSE: {
		id: 35348,
		name: 'Steel Muse',
		icon: iconUrl(3843),
		cooldown: 60000,
		charges: 2,
		cooldownGroup: PCT_COOLDOWN_GROUPS.STEEL_MUSE,
	},
	STRIKING_MUSE: {
		id: 34674,
		name: 'Striking Muse',
		icon: iconUrl(3825),
		cooldown: 60000,
		charges: 2,
		cooldownGroup: PCT_COOLDOWN_GROUPS.STEEL_MUSE,
		statusesApplied: ['HAMMER_TIME'],
	},

	/** Landscape canvas spells */
	LANDSCAPE_MOTIF: {
		id: 34691,
		name: 'Lendscape Motif',
		icon: iconUrl(3841),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 4000,
	},
	STARRY_SKY_MOTIF: {
		id: 34669,
		name: 'Starry Sky Motif',
		icon: iconUrl(3820),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 4000,
	},

	/** Landscape canvas abilities */
	SCENIC_MUSE: {
		id: 35349,
		name: 'Scenic Muse',
		icon: iconUrl(3844),
		cooldown: 120000,
		cooldownGroup: PCT_COOLDOWN_GROUPS.SCENIC_MUSE,
	},
	STARRY_MUSE: {
		id: 34675,
		name: 'Starry Muse',
		icon: iconUrl(3826),
		cooldown: 120000,
		cooldownGroup: PCT_COOLDOWN_GROUPS.SCENIC_MUSE,
		statusesApplied: ['STARRY_MUSE', 'SUBTRACTIVE_SPECTRUM', 'INSPIRATION', 'HYPERPHANTASIA', 'STARSTRUCK'],
	},

	/** Utility */
	TEMPERA_COAT: {
		id: 34685,
		name: 'Tempura Coat',
		icon: iconUrl(3835),
		cooldown: 60000,
		statusesApplied: ['TEMPERA_COAT'],
	},
	TEMPERA_GRASSA: {
		id: 34686,
		name: 'Tempura Grassa',
		icon: iconUrl(3836),
		cooldown: 1000,
		statusesApplied: ['TEMPERA_GRASSA'],
	},
	SMUDGE: {
		id: 34684,
		name: 'Smudge',
		icon: iconUrl(3834),
		cooldown: 20000,
		statusesApplied: ['SMUDGE'],
	},
	SUBTRACTIVE_PALLETTE: {
		id: 34683,
		name: 'Subtractive Pallette',
		icon: iconUrl(3833),
		cooldown: 20000,
		statusesApplied: ['SUBTRACTIVE_PALLETTE', 'MONOCHROME_TONES'],
	},

})
