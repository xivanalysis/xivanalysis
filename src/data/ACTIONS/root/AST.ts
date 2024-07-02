import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions} from '../type'

export const AST = ensureActions({
	MALEFIC: {
		id: 3596,
		name: 'Malefic',
		icon: iconUrl(3120),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	BENEFIC: {
		id: 3594,
		name: 'Benefic',
		icon: iconUrl(3126),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
		statusesApplied: ['ENHANCED_BENEFIC_II'],
	},

	COMBUST: {
		id: 3599,
		name: 'Combust',
		icon: iconUrl(3124),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		mpCost: 400,
		statusesApplied: ['COMBUST'],
	},

	LIGHTSPEED: {
		id: 3606,
		name: 'Lightspeed',
		icon: iconUrl(3135),
		cooldown: 90000,
		cooldownGroup: 19,
		statusesApplied: ['LIGHTSPEED'],
	},

	HELIOS: {
		id: 3600,
		name: 'Helios',
		icon: iconUrl(3129),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 700,
	},

	ASCEND: {
		id: 3603,
		name: 'Ascend',
		icon: iconUrl(3132),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 8000,
		mpCost: 2400,
	},

	ESSENTIAL_DIGNITY: {
		id: 3614,
		name: 'Essential Dignity',
		icon: iconUrl(3141),
		cooldown: 40000,
		cooldownGroup: 9,
		charges: 3,
	},

	BENEFIC_II: {
		id: 3610,
		name: 'Benefic II',
		icon: iconUrl(3128),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 700,
	},

	ASTRAL_DRAW: {
		id: 37017,
		name: 'Astral Draw',
		icon: iconUrl(3564),
		cooldown: 60000,
		cooldownGroup: 15,
	},

	UMBRAL_DRAW: {
		id: 37018,
		name: 'Umbral Draw',
		icon: iconUrl(3565),
		cooldown: 60000,
		cooldownGroup: 15,
	},

	PLAY_I: {
		id: 37019,
		name: 'Play I',
		icon: iconUrl(3116),
		cooldown: 1000,
		cooldownGroup: 2,
	},

	PLAY_II: {
		id: 37020,
		name: 'Play II',
		icon: iconUrl(3117),
		cooldown: 1000,
		cooldownGroup: 2,
	},

	PLAY_III: {
		id: 37021,
		name: 'Play III',
		icon: iconUrl(3118),
		cooldown: 1000,
		cooldownGroup: 2,
	},

	ASPECTED_BENEFIC: {
		id: 3595,
		name: 'Aspected Benefic',
		icon: iconUrl(3127),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 0,
		mpCost: 400,
		statusesApplied: ['ASPECTED_BENEFIC'],
	},

	ASPECTED_HELIOS: {
		id: 3601,
		name: 'Aspected Helios',
		icon: iconUrl(3130),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 800,
		statusesApplied: ['ASPECTED_HELIOS'],
	},

	GRAVITY: {
		id: 3615,
		name: 'Gravity',
		icon: iconUrl(3123),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	COMBUST_II: {
		id: 3608,
		name: 'Combust II',
		icon: iconUrl(3125),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		mpCost: 400,
		statusesApplied: ['COMBUST_II'],
	},

	SYNASTRY: {
		id: 3612,
		name: 'Synastry',
		icon: iconUrl(3139),
		cooldown: 120000,
		cooldownGroup: 20,
		statusesApplied: ['SYNASTRY_SELF', 'SYNASTRY'],
	},

	DIVINATION: {
		id: 16552,
		name: 'Divination',
		icon: iconUrl(3553),
		cooldown: 120000,
		cooldownGroup: 21,
		statusesApplied: ['DIVINATION'],
	},

	MALEFIC_II: {
		id: 3598,
		name: 'Malefic II',
		icon: iconUrl(3122),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	COLLECTIVE_UNCONSCIOUS: {
		id: 3613,
		name: 'Collective Unconscious',
		icon: iconUrl(3140),
		cooldown: 60000,
		cooldownGroup: 10,
		statusesApplied: [
			'COLLECTIVE_UNCONSCIOUS_MITIGATION',
			'COLLECTIVE_UNCONSCIOUS',
			'WHEEL_OF_FORTUNE',
		],
	},

	CELESTIAL_OPPOSITION: {
		id: 16553,
		name: 'Celestial Opposition',
		icon: iconUrl(3142),
		cooldown: 60000,
		cooldownGroup: 12,
		statusesApplied: ['OPPOSITION'],
	},

	EARTHLY_STAR: {
		id: 7439,
		name: 'Earthly Star',
		icon: iconUrl(3143),
		cooldown: 60000,
		cooldownGroup: 11,
		statusesApplied: ['EARTHLY_DOMINANCE', 'GIANT_DOMINANCE'],
	},

	STELLAR_BURST: {
		id: 7440,
		name: 'Stellar Burst',
		icon: iconUrl(405),
	},

	STELLAR_EXPLOSION: {
		id: 7441,
		name: 'Stellar Explosion',
		icon: iconUrl(405),
	},

	STELLAR_DETONATION: {
		id: 8324,
		name: 'Stellar Detonation',
		icon: iconUrl(3144),
		cooldown: 3000,
		cooldownGroup: 7,
	},

	MALEFIC_III: {
		id: 7442,
		name: 'Malefic III',
		icon: iconUrl(3145),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	MINOR_ARCANA: {
		id: 37022,
		name: 'Minor Arcana',
		icon: iconUrl(3119),
		cooldown: 1000,
		cooldownGroup: 5,
	},

	// ----
	// 71-80
	// ----

	COMBUST_III: {
		id: 16554,
		name: 'Combust III',
		icon: iconUrl(3554),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		mpCost: 400,
		statusesApplied: ['COMBUST_III'],
	},

	MALEFIC_IV: {
		id: 16555,
		name: 'Malefic IV',
		icon: iconUrl(3555),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	CELESTIAL_INTERSECTION: {
		id: 16556,
		name: 'Celestial Intersection',
		icon: iconUrl(3556),
		cooldown: 30000,
		cooldownGroup: 8,
		charges: 2,
		statusesApplied: ['INTERSECTION'],
	},

	HOROSCOPE: {
		id: 16557,
		name: 'Horoscope',
		icon: iconUrl(3550),
		cooldown: 60000,
		cooldownGroup: 13,
		statusesApplied: ['HOROSCOPE', 'HOROSCOPE_HELIOS'],
	},

	HOROSCOPE_ACTIVATION: {
		id: 16558,
		name: 'Horoscope Activation',
		icon: iconUrl(3551),
		cooldown: 0,
	},

	NEUTRAL_SECT: {
		id: 16559,
		name: 'Neutral Sect',
		icon: iconUrl(3552),
		cooldown: 120000,
		cooldownGroup: 22,
		statusesApplied: ['NEUTRAL_SECT', 'NEUTRAL_SECT_OTHERS'],
	},

	// ----
	// 81-90
	// ----

	FALL_MALEFIC: {
		id: 25871,
		name: 'Fall Malefic',
		icon: iconUrl(3559),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	GRAVITY_II: {
		id: 25872,
		name: 'Gravity II',
		icon: iconUrl(3560),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	EXALTATION: {
		id: 25873,
		name: 'Exaltation',
		icon: iconUrl(3561),
		cooldown: 60000,
		cooldownGroup: 14,
		statusesApplied: ['EXALTATION'],
	},

	MACROCOSMOS: {
		id: 25874,
		name: 'Macrocosmos',
		icon: iconUrl(3562),
		cooldown: 180000,
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		mpCost: 600,
		cooldownGroup: 23,
		statusesApplied: ['MACROCOSMOS'],
	},

	MICROCOSMOS: {
		id: 25875,
		name: 'Microcosmos',
		icon: iconUrl(3563),
		cooldown: 1000,
		cooldownGroup: 1,
	},

	// ----
	// 91-100
	// ----

	ORACLE: {
		id: 37029,
		name: 'Oracle',
		icon: iconUrl(3566),
		cooldown: 1000,
		cooldownGroup: 3,
	},

	HELIOS_CONJUNCTION: {
		id: 37030,
		name: 'Helios Conjunction',
		icon: iconUrl(3567),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 800,
		statusesApplied: ['HELIOS_CONJUNCTION'],
	},

	SUN_SIGN: {
		id: 37031,
		name: 'Sun Sign',
		icon: iconUrl(3109),
		cooldown: 1000,
		statusesApplied: ['SUN_SIGN'],
		cooldownGroup: 6,
	},

	// -----
	// Arcana cast
	// -----

	THE_BALANCE: {
		id: 37023,
		name: 'The Balance',
		icon: iconUrl(3110),
		cooldown: 1000,
		statusesApplied: ['THE_BALANCE'],
		cooldownGroup: 2,
	},

	THE_BOLE: {
		id: 37027,
		name: 'The Bole',
		icon: iconUrl(3111),
		cooldown: 1000,
		statusesApplied: ['THE_BOLE'],
		cooldownGroup: 2,
	},

	THE_ARROW: {
		id: 37024,
		name: 'The Arrow',
		icon: iconUrl(3112),
		cooldown: 1000,
		statusesApplied: ['THE_ARROW'],
		cooldownGroup: 2,
	},

	THE_SPEAR: {
		id: 37026,
		name: 'The Spear',
		icon: iconUrl(3113),
		cooldown: 1000,
		statusesApplied: ['THE_SPEAR'],
		cooldownGroup: 2,
	},

	THE_EWER: {
		id: 37028,
		name: 'The Ewer',
		icon: iconUrl(3114),
		cooldown: 1000,
		statusesApplied: ['THE_EWER'],
		cooldownGroup: 2,
	},

	THE_SPIRE: {
		id: 37025,
		name: 'The Spire',
		icon: iconUrl(3115),
		cooldown: 1000,
		statusesApplied: ['THE_SPIRE'],
		cooldownGroup: 2,
	},

	LADY_OF_CROWNS: {
		id: 7445,
		name: 'Lady Of Crowns',
		icon: iconUrl(3146),
		cooldown: 1000,
		cooldownGroup: 5,
	},

	LORD_OF_CROWNS: {
		id: 7444,
		name: 'Lord Of Crowns',
		icon: iconUrl(3147),
		cooldown: 1000,
		cooldownGroup: 5,
	},
})
