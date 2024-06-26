import {Attribute} from 'event'
import {ensureActions} from '../type'

export const PCT_COOLDOWN_GROUPS = {
	LIVING_MUSE: 1, // TODO
	MOG_OF_THE_AGES: 2, // TODO
	STEEL_MUSE: 3, // TODO
	SCENIC_MUSE: 4, // TODO
}

export const PCT = ensureActions({
	/** Single-target Astral aspected spells */
	FIRE_IN_RED: {
		id: 34650,
		name: 'Fire in Red',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 200,
		statusesApplied: ['AETHERHUES'],
	},
	AERO_IN_GREEN: {
		id: 34651,
		name: 'Aero in Green',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 200,
		statusesApplied: ['AETHERHUES_II'],
	},
	WATER_IN_BLUE: {
		id: 34652,
		name: 'Water in Blue',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 200,
	},

	/** AoE Astral aspected spells */
	FIRE_II_IN_RED: {
		id: 34656,
		name: 'Fire II in Red',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 300,
		statusesApplied: ['AETHERHUES'],
	},
	AERO_II_IN_GREEN: {
		id: 34657,
		name: 'Aero II in Green',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 300,
		statusesApplied: ['AETHERHUES_II'],
	},
	WATER_II_IN_BLUE: {
		id: 34658,
		name: 'Water II in Blue',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 300,
	},
	HOLY_IN_WHITE: {
		id: 34662,
		name: 'Holy in White',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		mpCost: 200,
	},

	/** Single-target Umbral aspected spells */
	BLIZZARD_IN_CYAN: {
		id: 34653,
		name: 'Blizzard in Cyan',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
		gcdRecast: 3500,
		mpCost: 300,
		statusesApplied: ['AETHERHUES'],
	},
	STONE_IN_YELLOW: {
		id: 34654,
		name: 'Stone in Yellow',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
		gcdRecast: 3500,
		mpCost: 300,
		statusesApplied: ['AETHERHUES_II'],
	},
	THUNDER_IN_MAGENTA: {
		id: 34655,
		name: 'Thunder in Magenta',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
		gcdRecast: 3500,
		mpCost: 300,
	},

	/** AoE Umbral aspected spells */
	BLIZZARD_II_IN_CYAN: {
		id: 34659,
		name: 'Blizzard II in Cyan',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
		gcdRecast: 3500,
		mpCost: 400,
		statusesApplied: ['AETHERHUES'],
	},
	STONE_II_IN_YELLOW: {
		id: 34660,
		name: 'Stone II in Yellow',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
		gcdRecast: 3500,
		mpCost: 400,
		statusesApplied: ['AETHERHUES_II'],
	},
	THUNDER_II_IN_MAGENTA: {
		id: 34661,
		name: 'Thunder II in Magenta',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
		gcdRecast: 3500,
		mpCost: 400,
	},
	COMET_IN_BLACK: {
		id: 34663,
		name: 'Comet in Black',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		gcdRecast: 3500,
		mpCost: 300,
	},

	/** Unaspected spells */
	RAINBOW_DRIP: {
		id: 34688,
		name: 'Rainbow Drip',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 4000,
		gcdRecast: 6000,
	},
	STAR_PRISM: {
		id: 34681,
		name: 'Star Prism',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	/** Creature canvas spells */
	CREATURE_MOTIF: {
		id: 34689,
		name: 'Creature Motif',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 4000,
	},
	POM_MOTIF: {
		id: 34664,
		name: 'Pom Motif',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 4000,
	},
	WING_MOTIF: {
		id: 34665,
		name: 'Wing Motif',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 4000,
	},
	CLAW_MOTIF: {
		id: 34666,
		name: 'Claw Motif',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 4000,
	},
	MAW_MOTIF: {
		id: 34667,
		name: 'Maw Motif',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 4000,
	},

	/** Creature canvas abilites */
	LIVING_MUSE: {
		id: 35347,
		name: 'Living Muse',
		icon: 'TODO',
		cooldown: 40000,
		charges: 3,
		cooldownGroup: PCT_COOLDOWN_GROUPS.LIVING_MUSE,
	},
	POM_MUSE: {
		id: 34670,
		name: 'Pom Muse',
		icon: 'TODO',
		cooldown: 40000,
		charges: 3,
		cooldownGroup: PCT_COOLDOWN_GROUPS.LIVING_MUSE,
	},
	WINGED_MUSE: {
		id: 34671,
		name: 'Winged Muse',
		icon: 'TODO',
		cooldown: 40000,
		charges: 3,
		cooldownGroup: PCT_COOLDOWN_GROUPS.LIVING_MUSE,
	},
	MOG_OF_THE_AGES: {
		id: 34676,
		name: 'Mog of the Ages',
		icon: 'TODO',
		cooldown: 30000,
		cooldownGroup: PCT_COOLDOWN_GROUPS.MOG_OF_THE_AGES,
	},
	CLAWED_MUSE: {
		id: 34672,
		name: 'Clawed Muse',
		icon: 'TODO',
		cooldown: 40000,
		charges: 3,
		cooldownGroup: PCT_COOLDOWN_GROUPS.LIVING_MUSE,
	},
	FANGED_MUSE: {
		id: 34673,
		name: 'Fanged Muse',
		icon: 'TODO',
		cooldown: 40000,
		charges: 3,
		cooldownGroup: PCT_COOLDOWN_GROUPS.LIVING_MUSE,
	},
	RETRIBUTION_OF_THE_MADEEN: {
		id: 34677,
		name: 'Mog of the Ages',
		icon: 'TODO',
		cooldown: 30000,
		cooldownGroup: PCT_COOLDOWN_GROUPS.MOG_OF_THE_AGES,
	},

	/** Weapon canvas spells */
	WEAPON_MOTIF: {
		id: 34690,
		name: 'Weapon Motif',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 4000,
	},
	HAMMER_MOTIF: {
		id: 34668,
		name: 'Hammer Motif',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 4000,
	},
	HAMMER_STAMP: {
		id: 34678,
		name: 'Hammer Stamp',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		combo: {
			start: true,
		},
	},
	HAMMER_BRUSH: {
		id: 34679,
		name: 'Hammer Brush',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		combo: {
			from: 31, // Combos from Hammer Stamp
		},
	},
	POLISHING_HAMMER: {
		id: 34680,
		name: 'Polishing Hammer',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		combo: {
			from: 32, // Combos from Hammer brush,
			end: true,
		},
	},

	/** Weapon canvas abilites */
	STEEL_MUSE: {
		id: 35348,
		name: 'Steel Muse',
		icon: 'TODO',
		cooldown: 40000,
		charges: 2,
		cooldownGroup: PCT_COOLDOWN_GROUPS.STEEL_MUSE,
	},
	STRIKING_MUSE: {
		id: 34674,
		name: 'Striking Muse',
		icon: 'TODO',
		cooldown: 40000,
		charges: 2,
		cooldownGroup: PCT_COOLDOWN_GROUPS.STEEL_MUSE,
		statusesApplied: ['HAMMER_TIME'],
	},

	/** Landscape canvas spells */
	LANDSCAPE_MOTIF: {
		id: 34691,
		name: 'Lendscape Motif',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 4000,
	},
	STARRY_SKY_MOTIF: {
		id: 34669,
		name: 'Starry Sky Motif',
		icon: 'TODO',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 3000,
		gcdRecast: 4000,
	},

	/** Landscape canvas abilities */
	SCENIC_MUSE: {
		id: 35349,
		name: 'Scenic Muse',
		icon: 'TODO',
		cooldown: 120000,
		cooldownGroup: PCT_COOLDOWN_GROUPS.SCENIC_MUSE,
	},
	STARRY_MUSE: {
		id: 34675,
		name: 'Starry Muse',
		icon: 'TODO',
		cooldown: 40000,
		charges: 2,
		cooldownGroup: PCT_COOLDOWN_GROUPS.SCENIC_MUSE,
		statusesApplied: ['STARRY_MUSE', 'SUBTRACTIVE_SPECTRUM', 'INSPIRATION', 'HYPERPHANTASIA', 'STARSTRUCK'],
	},

	/** Utility */
	TEMPURA_COAT: {
		id: 34685,
		name: 'Tempura Coat',
		icon: 'TODO',
		cooldown: 60000,
		statusesApplied: ['TEMPURA_COAT'],
	},
	TEMPURA_GRASSA: {
		id: 34686,
		name: 'Tempura Grassa',
		icon: 'TODO',
		cooldown: 1000,
		statusesApplied: ['TEMPURA_GRASSA'],
	},
	SMUDGE: {
		id: 34684,
		name: 'Smudge',
		icon: 'TODO',
		cooldown: 20000,
		statusesApplied: ['SMUDGE'],
	},
	SUBTRACTIVE_PALLETTE: {
		id: 34683,
		name: 'Subtractive Pallette',
		icon: 'TODO',
		cooldown: 20000,
		statusesApplied: ['SUBTRACTIVE_PALLETTE', 'MONOCHROME_TONES'],
	},

})
