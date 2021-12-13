import {Attribute} from 'event'
import {ensureActions} from '../type'

export const AST = ensureActions({
	BENEFIC: {
		id: 3594,
		name: 'Benefic',
		icon: 'https://xivapi.com/i/003000/003126.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
		statusesApplied: ['ENHANCED_BENEFIC_II'],
	},

	BENEFIC_II: {
		id: 3610,
		name: 'Benefic II',
		icon: 'https://xivapi.com/i/003000/003128.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 700,
	},

	ASCEND: {
		id: 3603,
		name: 'Ascend',
		icon: 'https://xivapi.com/i/003000/003132.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 8000,
		mpCost: 2400,
	},

	LIGHTSPEED: {
		id: 3606,
		name: 'Lightspeed',
		icon: 'https://xivapi.com/i/003000/003135.png',
		cooldown: 90000,
		statusesApplied: ['LIGHTSPEED'],
	},

	MALEFIC_III: {
		id: 7442,
		name: 'Malefic III',
		icon: 'https://xivapi.com/i/003000/003145.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	MALEFIC_IV: {
		id: 16555,
		name: 'Malefic IV',
		icon: 'https://xivapi.com/i/003000/003555.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	FALL_MALEFIC: {
		id: 25871,
		name: 'Fall Malefic',
		icon: 'https://xivapi.com/i/003000/003559.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	COMBUST_II: {
		id: 3608,
		name: 'Combust II',
		icon: 'https://xivapi.com/i/003000/003125.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 0,
		mpCost: 400,
	},

	COMBUST_III: {
		id: 16554,
		name: 'Combust II',
		icon: 'https://xivapi.com/i/003000/003554.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 0,
		mpCost: 400,
	},

	GRAVITY: {
		id: 3615,
		name: 'Gravity',
		icon: 'https://xivapi.com/i/003000/003123.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	GRAVITY_II: {
		id: 25872,
		name: 'Gravity II',
		icon: 'https://xivapi.com/i/003000/003560.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	ESSENTIAL_DIGNITY: {
		id: 3614,
		name: 'Essential Dignity',
		icon: 'https://xivapi.com/i/003000/003141.png',
		cooldown: 40000,
		charges: 2,
	},

	ASPECTED_HELIOS: {
		id: 3601,
		name: 'Aspected Helios',
		icon: 'https://xivapi.com/i/003000/003130.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 800,
	},

	ASPECTED_BENEFIC: {
		id: 3595,
		name: 'Aspected Benefic',
		icon: 'https://xivapi.com/i/003000/003127.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 0,
		mpCost: 400,
	},

	HELIOS: {
		id: 3600,
		name: 'Helios',
		icon: 'https://xivapi.com/i/003000/003129.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 700,
	},

	SYNASTRY: {
		id: 3612,
		name: 'Synastry',
		icon: 'https://xivapi.com/i/003000/003139.png',
		cooldown: 120000,
		statusesApplied: ['SYNASTRY_SELF', 'SYNASTRY'],
	},

	COLLECTIVE_UNCONSCIOUS: {
		id: 3613,
		name: 'Collective Unconscious',
		icon: 'https://xivapi.com/i/003000/003140.png',
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
		icon: 'https://xivapi.com/i/003000/003142.png',
		cooldown: 60000,
		statusesApplied: ['OPPOSITION'],
	},

	EARTHLY_STAR: {
		id: 7439,
		name: 'Earthly Star',
		icon: 'https://xivapi.com/i/003000/003143.png',
		cooldown: 60000,
		statusesApplied: ['EARTHLY_DOMINANCE', 'GIANT_DOMINANCE'],
	},

	STELLAR_DETONATION: {
		id: 8324,
		name: 'Stellar Detonation',
		icon: 'https://xivapi.com/i/003000/003144.png',
		cooldown: 0,
	},

	STELLAR_BURST: {
		id: 7440,
		name: 'Stellar Burst',
		icon: 'https://xivapi.com/i/000000/000405.png',
	},

	STELLAR_EXPLOSION: {
		id: 7441,
		name: 'Stellar Detonation',
		icon: 'https://xivapi.com/i/000000/000405.png',
	},

	DRAW: {
		id: 3590,
		name: 'Draw',
		icon: 'https://xivapi.com/i/003000/003101.png',
		cooldown: 30000,
		charges: 2,
		statusesApplied: [
			'BALANCE_DRAWN',
			'BOLE_DRAWN',
			'ARROW_DRAWN',
			'SPEAR_DRAWN',
			'EWER_DRAWN',
			'SPIRE_DRAWN',
			'CLARIFYING_DRAW',
		],
	},

	PLAY: {
		id: 17055,
		name: 'Play',
		icon: 'https://xivapi.com/i/003000/003102.png',
		cooldown: 1000,
		cooldownGroup: 12,
	},

	CROWN_PLAY: {
		id: 25869,
		name: 'Crown Play',
		icon: 'https://xivapi.com/i/003000/003557.png',
		cooldown: 1000,
		cooldownGroup: 13,
	},

	REDRAW: {
		id: 3593,
		name: 'Redraw',
		icon: 'https://xivapi.com/i/003000/003105.png',
	},

	UNDRAW: {
		id: 9629,
		name: 'Undraw',
		icon: 'https://xivapi.com/i/003000/003108.png',
		cooldown: 1000,
	},

	MINOR_ARCANA: {
		id: 7443,
		name: 'Minor Arcana',
		icon: 'https://xivapi.com/i/003000/003106.png',
		cooldown: 60000,
		statusesApplied: ['LORD_OF_CROWNS_DRAWN', 'LADY_OF_CROWNS_DRAWN'],
	},

	// ----
	// 70-80
	// ----

	HOROSCOPE: {
		id: 16557,
		name: 'Horoscope',
		icon: 'https://xivapi.com/i/003000/003550.png',
		cooldown: 60000,
		statusesApplied: ['HOROSCOPE', 'HOROSCOPE_HELIOS'],
	},

	HOROSCOPE_ACTIVATION: {
		id: 16558,
		name: 'Horoscope Activation',
		icon: 'https://xivapi.com/i/003000/003551.png',
		cooldown: 0,
	},

	NEUTRAL_SECT: {
		id: 16559,
		name: 'Neutral Sect',
		icon: 'https://xivapi.com/i/003000/003552.png',
		cooldown: 120000,
		statusesApplied: ['NEUTRAL_SECT', 'NEUTRAL_SECT_OTHERS'],
	},

	DIVINATION: {
		id: 16552,
		name: 'Divination',
		icon: 'https://xivapi.com/i/003000/003553.png',
		cooldown: 120000,
		statusesApplied: ['DIVINATION'],
	},

	CELESTIAL_INTERSECTION: {
		id: 16556,
		name: 'Celestial Intersection',
		icon: 'https://xivapi.com/i/003000/003556.png',
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
		icon: 'https://xivapi.com/i/003000/003558.png',
		cooldown: 1000,
		statusesApplied:
			['HARMONY_OF_SPIRIT',
				'HARMONY_OF_BODY',
				'HARMONY_OF_MIND'],
	},

	EXALTATION: {
		id: 25873,
		name: 'Exaltation',
		icon: 'https://xivapi.com/i/003000/003561.png',
		cooldown: 60000,
		statusesApplied: ['EXALTATION'],
	},

	MACROCOSMOS: {
		id: 25874,
		name: 'Macrocosmos',
		icon: 'https://xivapi.com/i/003000/003562.png',
		cooldown: 180000,
		mpCost: 600,
		statusesApplied: ['MACROCOSMOS'],
	},

	MICROCOSMOS: {
		id: 25875,
		name: 'Microcosmos',
		icon: 'https://xivapi.com/i/003000/003563.png',
		cooldown: 1000,
	},

	// -----
	// Arcana cast
	// -----

	THE_BALANCE: {
		id: 4401,
		name: 'The Balance',
		icon: 'https://xivapi.com/i/003000/003110.png',
		cooldown: 1000,
		statusesApplied: ['THE_BALANCE'],
		cooldownGroup: 12,
	},

	THE_BOLE: {
		id: 4404,
		name: 'The Bole',
		icon: 'https://xivapi.com/i/003000/003111.png',
		cooldown: 1000,
		statusesApplied: ['THE_BOLE'],
		cooldownGroup: 12,
	},

	THE_ARROW: {
		id: 4402,
		name: 'The Arrow',
		icon: 'https://xivapi.com/i/003000/003112.png',
		cooldown: 1000,
		statusesApplied: ['THE_ARROW'],
		cooldownGroup: 12,
	},

	THE_SPEAR: {
		id: 4403,
		name: 'The Spear',
		icon: 'https://xivapi.com/i/003000/003113.png',
		cooldown: 1000,
		statusesApplied: ['THE_SPEAR'],
		cooldownGroup: 12,
	},

	THE_EWER: {
		id: 4405,
		name: 'The Ewer',
		icon: 'https://xivapi.com/i/003000/003114.png',
		cooldown: 1000,
		statusesApplied: ['THE_EWER'],
		cooldownGroup: 12,
	},

	THE_SPIRE: {
		id: 4406,
		name: 'The Spire',
		icon: 'https://xivapi.com/i/003000/003115.png',
		cooldown: 1000,
		statusesApplied: ['THE_SPIRE'],
		cooldownGroup: 12,
	},

	LADY_OF_CROWNS: {
		id: 7445,
		name: 'Lady Of Crowns',
		icon: 'https://xivapi.com/i/003000/003146.png',
		cooldown: 1000,
		cooldownGroup: 13,
	},

	LORD_OF_CROWNS: {
		id: 7444,
		name: 'Lord Of Crowns',
		icon: 'https://xivapi.com/i/003000/003147.png',
		cooldown: 1000,
		cooldownGroup: 13,
	},
})
