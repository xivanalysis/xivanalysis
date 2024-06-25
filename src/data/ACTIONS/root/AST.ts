import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions} from '../type'

export const AST = ensureActions({
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

	BENEFIC_II: {
		id: 3610,
		name: 'Benefic II',
		icon: iconUrl(3128),
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

	LIGHTSPEED: {
		id: 3606,
		name: 'Lightspeed',
		icon: iconUrl(3135),
		cooldown: 90000,
		statusesApplied: ['LIGHTSPEED'],
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

	MALEFIC_IV: {
		id: 16555,
		name: 'Malefic IV',
		icon: iconUrl(3555),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	FALL_MALEFIC: {
		id: 25871,
		name: 'Fall Malefic',
		icon: iconUrl(3559),
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
		castTime: 0,
		mpCost: 400,
	},

	COMBUST_III: {
		id: 16554,
		name: 'Combust III',
		icon: iconUrl(3554),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 0,
		mpCost: 400,
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

	GRAVITY_II: {
		id: 25872,
		name: 'Gravity II',
		icon: iconUrl(3560),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	ESSENTIAL_DIGNITY: {
		id: 3614,
		name: 'Essential Dignity',
		icon: iconUrl(3141),
		cooldown: 40000,
		charges: 2,
	},

	ASPECTED_HELIOS: {
		id: 3601,
		name: 'Aspected Helios',
		icon: iconUrl(3130),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 800,
	},

	ASPECTED_BENEFIC: {
		id: 3595,
		name: 'Aspected Benefic',
		icon: iconUrl(3127),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 0,
		mpCost: 400,
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

	SYNASTRY: {
		id: 3612,
		name: 'Synastry',
		icon: iconUrl(3139),
		cooldown: 120000,
		statusesApplied: ['SYNASTRY_SELF', 'SYNASTRY'],
	},

	COLLECTIVE_UNCONSCIOUS: {
		id: 3613,
		name: 'Collective Unconscious',
		icon: iconUrl(3140),
		cooldown: 60000,
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
		statusesApplied: ['OPPOSITION'],
	},

	EARTHLY_STAR: {
		id: 7439,
		name: 'Earthly Star',
		icon: iconUrl(3143),
		cooldown: 60000,
		statusesApplied: ['EARTHLY_DOMINANCE', 'GIANT_DOMINANCE'],
	},

	STELLAR_DETONATION: {
		id: 8324,
		name: 'Stellar Detonation',
		icon: iconUrl(3144),
		cooldown: 0,
	},

	STELLAR_BURST: {
		id: 7440,
		name: 'Stellar Burst',
		icon: iconUrl(405),
	},

	STELLAR_EXPLOSION: {
		id: 7441,
		name: 'Stellar Detonation',
		icon: iconUrl(405),
	},

	DRAW: {
		id: 3590,
		name: 'Draw',
		icon: iconUrl(3101),
		cooldown: 30000,
		charges: 2,
		statusesApplied: [
			'CLARIFYING_DRAW',
			'BALANCE_DRAWN',
			'BOLE_DRAWN',
			'ARROW_DRAWN',
			'SPEAR_DRAWN',
			'EWER_DRAWN',
			'SPIRE_DRAWN',
		],
	},

	PLAY: {
		id: 17055,
		name: 'Play',
		icon: iconUrl(3102),
		cooldown: 1000,
		cooldownGroup: 12,
	},

	CROWN_PLAY: {
		id: 25869,
		name: 'Crown Play',
		icon: iconUrl(3557),
		cooldown: 1000,
		cooldownGroup: 13,
	},

	REDRAW: {
		id: 3593,
		name: 'Redraw',
		icon: iconUrl(3105),
	},

	UNDRAW: {
		id: 9629,
		name: 'Undraw',
		icon: iconUrl(3108),
		cooldown: 1000,
	},

	MINOR_ARCANA: {
		id: 7443,
		name: 'Minor Arcana',
		icon: iconUrl(3106),
		cooldown: 60000,
		statusesApplied: ['LORD_OF_CROWNS_DRAWN', 'LADY_OF_CROWNS_DRAWN'],
	},

	// ----
	// 70-80
	// ----

	HOROSCOPE: {
		id: 16557,
		name: 'Horoscope',
		icon: iconUrl(3550),
		cooldown: 60000,
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
		statusesApplied: ['NEUTRAL_SECT', 'NEUTRAL_SECT_OTHERS'],
	},

	DIVINATION: {
		id: 16552,
		name: 'Divination',
		icon: iconUrl(3553),
		cooldown: 120000,
		statusesApplied: ['DIVINATION'],
	},

	CELESTIAL_INTERSECTION: {
		id: 16556,
		name: 'Celestial Intersection',
		icon: iconUrl(3556),
		cooldown: 30000,
		statusesApplied: ['INTERSECTION'],
		charges: 2,
	},

	// ----
	// 81-90
	// ----

	ASTRODYNE: {
		id: 25870,
		name: 'Astrodyne',
		icon: iconUrl(3558),
		cooldown: 1000,
		statusesApplied:
			['HARMONY_OF_SPIRIT',
				'HARMONY_OF_BODY',
				'HARMONY_OF_MIND'],
	},

	EXALTATION: {
		id: 25873,
		name: 'Exaltation',
		icon: iconUrl(3561),
		cooldown: 60000,
		statusesApplied: ['EXALTATION'],
	},

	MACROCOSMOS: {
		id: 25874,
		name: 'Macrocosmos',
		icon: iconUrl(3562),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 0,
		cooldown: 180000,
		gcdRecast: 2500,
		mpCost: 600,
		statusesApplied: ['MACROCOSMOS'],
	},

	MICROCOSMOS: {
		id: 25875,
		name: 'Microcosmos',
		icon: iconUrl(3563),
		cooldown: 1000,
	},

	// -----
	// Arcana cast
	// -----

	THE_BALANCE: {
		id: 4401,
		name: 'The Balance',
		icon: iconUrl(3110),
		cooldown: 1000,
		statusesApplied: ['THE_BALANCE'],
		cooldownGroup: 12,
	},

	THE_BOLE: {
		id: 4404,
		name: 'The Bole',
		icon: iconUrl(3111),
		cooldown: 1000,
		statusesApplied: ['THE_BOLE'],
		cooldownGroup: 12,
	},

	THE_ARROW: {
		id: 4402,
		name: 'The Arrow',
		icon: iconUrl(3112),
		cooldown: 1000,
		statusesApplied: ['THE_ARROW'],
		cooldownGroup: 12,
	},

	THE_SPEAR: {
		id: 4403,
		name: 'The Spear',
		icon: iconUrl(3113),
		cooldown: 1000,
		statusesApplied: ['THE_SPEAR'],
		cooldownGroup: 12,
	},

	THE_EWER: {
		id: 4405,
		name: 'The Ewer',
		icon: iconUrl(3114),
		cooldown: 1000,
		statusesApplied: ['THE_EWER'],
		cooldownGroup: 12,
	},

	THE_SPIRE: {
		id: 4406,
		name: 'The Spire',
		icon: iconUrl(3115),
		cooldown: 1000,
		statusesApplied: ['THE_SPIRE'],
		cooldownGroup: 12,
	},

	LADY_OF_CROWNS: {
		id: 7445,
		name: 'Lady Of Crowns',
		icon: iconUrl(3146),
		cooldown: 1000,
		cooldownGroup: 13,
	},

	LORD_OF_CROWNS: {
		id: 7444,
		name: 'Lord Of Crowns',
		icon: iconUrl(3147),
		cooldown: 1000,
		cooldownGroup: 13,
	},
})
