import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions} from '../type'

// tslint:disable:no-magic-numbers

export const RDM = ensureActions({
	// -----
	// Cooldowns
	// -----
	EMBOLDEN: {
		id: 7520,
		name: 'Embolden',
		icon: iconUrl(3218),
		cooldown: 120000,
		statusesApplied: ['EMBOLDEN_SELF', 'EMBOLDEN_PARTY', 'THORNED_FLOURISH'],
	},
	ACCELERATION: {
		id: 7518,
		name: 'Acceleration',
		icon: iconUrl(3214),
		cooldown: 55000,
		statusesApplied: ['ACCELERATION', 'GRAND_IMPACT_READY'],
		charges: 2,
	},
	MANAFICATION: {
		id: 7521,
		name: 'Manafication',
		icon: iconUrl(3219),
		cooldown: 110000,
		breaksCombo: true,
		statusesApplied: ['MANAFICATION', 'PREFULGENCE_READY'],
	},
	CONTRE_SIXTE: {
		id: 7519,
		name: 'Contre Sixte',
		icon: iconUrl(3217),
		cooldown: 35000,
		potency: 400,
	},
	DISPLACEMENT: {
		id: 7515,
		name: 'Displacement',
		icon: iconUrl(3211),
		cooldown: 35000,
		potency: 180,
		cooldownGroup: 10,
		charges: 2,
	},
	ENGAGEMENT: {
		id: 16527,
		name: 'Engagement',
		icon: iconUrl(3231),
		cooldown: 35000,
		potency: 180,
		cooldownGroup: 10,
		charges: 2,
	},
	CORPS_A_CORPS: {
		id: 7506,
		name: 'Corps-a-corps',
		icon: iconUrl(3204),
		cooldown: 35000,
		potency: 130,
		charges: 2,
	},
	FLECHE: {
		id: 7517,
		name: 'Fleche',
		icon: iconUrl(3212),
		cooldown: 25000,
		potency: 480,
	},
	VICE_OF_THORNS: {
		id: 37005,
		name: 'Vice of Thorns',
		icon: iconUrl(3242),
		potency: 700,
	},
	GRAND_IMPACT: {
		id: 37006,
		name: 'Grand Impact',
		icon: iconUrl(3243),
		potency: 600, // Gives 3 white, 3 black
		onGcd: true,
		cooldown: 2500,
		breaksCombo: true,
	},
	PREFULGENCE: {
		id: 37007,
		name: 'Prefulgence',
		icon: iconUrl(3244),
		potency: 900,
	},
	MAGICK_BARRIER: {
		id: 25857,
		name: 'Magick Barrier',
		icon: iconUrl(3237),
		cooldown: 120000,
		statusesApplied: ['MAGICK_BARRIER'],
	},

	// -----
	// Actions
	// -----
	RIPOSTE: {
		id: 7504,
		name: 'Riposte',
		icon: iconUrl(3201),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 2500,
		potency: 130,
		combo: {
			start: true,
		},
	},
	ENCHANTED_RIPOSTE: {
		id: 7527,
		name: 'Enchanted Riposte',
		icon: iconUrl(3225),
		onGcd: true,
		cooldown: 1500,
		potency: 300, // consumes 20 white, 20 black
		combo: {
			start: true,
		},
	},
	ZWERCHHAU: {
		id: 7512,
		name: 'Zwerchhau',
		icon: iconUrl(3210),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 2500,
		potency: 100,
		combo: {
			from: 7504,
			potency: 150,
		},
	},
	ENCHANTED_ZWERCHHAU: {
		id: 7528,
		name: 'Enchanted Zwerchhau',
		icon: iconUrl(3226),
		onGcd: true,
		cooldown: 1500,
		potency: 170, // consumes 15 white, 15 black
		combo: {
			from: 7527,
			potency: 360,
		},
	},
	REDOUBLEMENT: {
		id: 7516,
		name: 'Redoublement',
		icon: iconUrl(3213),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 2500,
		potency: 100,
		combo: {
			from: 7512,
			potency: 230,
			end: true,
		},
	},
	ENCHANTED_REDOUBLEMENT: {
		id: 7529,
		name: 'Enchanted Redoublement',
		icon: iconUrl(3227),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 2200,
		potency: 170, // consumes 15 white, 15 black
		combo: {
			from: 7528,
			potency: 540,
			end: true,
		},
	},
	REPRISE: {
		id: 16529,
		name: 'Reprise',
		icon: iconUrl(3233),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 2500,
		potency: 100,
	},
	ENCHANTED_REPRISE: {
		id: 16528,
		name: 'Enchanted Reprise',
		icon: iconUrl(3232),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 2500,
		potency: 380, // consumes 10 white, 10 black
	},
	VERFLARE: {
		id: 7525,
		name: 'Verflare',
		icon: iconUrl(3223),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 2500,
		potency: 620, // Gains 11 Black Mana, if Black is lower 100% Verfire ready
		combo: {
			start: true,
		},
	},
	VERHOLY: {
		id: 7526,
		name: 'Verholy',
		icon: iconUrl(3224),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 2500,
		potency: 620, // Gains 11 white, if White is lower 100% Verstone ready
		combo: {
			start: true,
		},
	},
	SCORCH: {
		id: 16530,
		name: 'Scorch',
		icon: iconUrl(3234),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 2500,
		potency: 700, // Gains 7 white and black
		combo: {
			from: [7525, 7526],
			potency: 680,
		},
	},
	RESOLUTION: {
		id: 25858,
		name: 'Resolution',
		icon: iconUrl(3238),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 2500,
		potency: 800, // Increase White and Black by 4
		combo: {
			from: 16530,
			potency: 800,
			end: true,
		},
	},
	JOLT: {
		id: 7503,
		name: 'Jolt',
		icon: iconUrl(3202),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 2500,
		potency: 170,
		castTime: 2000, // Increase White and Black by 2
		breaksCombo: true,
	},
	JOLT_II: {
		id: 7524,
		name: 'Jolt II',
		icon: iconUrl(3220),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 2500,
		castTime: 2000,
		potency: 280, // Increase White and Black by 2
		breaksCombo: true,
	},
	JOLT_III: {
		id: 37004,
		name: 'Jolt III',
		icon: iconUrl(3241),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 2500,
		castTime: 2000,
		potency: 360, // Increase White and Black by 2
		breaksCombo: true,
	},
	IMPACT: {
		id: 16526,
		name: 'Impact',
		icon: iconUrl(3222),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 2500,
		castTime: 5000,
		potency: 210, // Increase White and Black by 3
		breaksCombo: true,
	},
	VERTHUNDER: {
		id: 7505,
		name: 'Verthunder',
		icon: iconUrl(3203),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 2500,
		castTime: 5000,
		potency: 360, // Increase Black by 6
		breaksCombo: true,
	},
	VERTHUNDER_II: {
		id: 16524,
		name: 'Verthunder II',
		icon: iconUrl(3229),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 2500,
		castTime: 2000,
		potency: 140, // Increase Black by 7
		breaksCombo: true,
	},
	VERTHUNDER_III: {
		id: 25855,
		name: 'Verthunder III',
		icon: iconUrl(3235),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 2500,
		castTime: 5000,
		potency: 420, // Increase Black by 6
		breaksCombo: true,
	},
	VERFIRE: {
		id: 7510,
		name: 'Verfire',
		icon: iconUrl(3208),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 2500,
		castTime: 2000,
		potency: 380, // Increase Black by 5
		breaksCombo: true,
	},
	VERAERO: {
		id: 7507,
		name: 'Veraero',
		icon: iconUrl(3205),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 2500,
		castTime: 5000,
		potency: 360, // Increase White by 6
		breaksCombo: true,
	},
	VERAERO_II: {
		id: 16525,
		name: 'Veraero II',
		icon: iconUrl(3230),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 2500,
		castTime: 2000,
		potency: 140, // Increase White by 7
		breaksCombo: true,
	},
	VERAERO_III: {
		id: 25856,
		name: 'Veraero III',
		icon: iconUrl(3236),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 2500,
		castTime: 5000,
		potency: 420, // Increase White by 6
		breaksCombo: true,
	},
	VERSTONE: {
		id: 7511,
		name: 'Verstone',
		icon: iconUrl(3209),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 2500,
		castTime: 2000,
		potency: 380, // Increase White by 5
		breaksCombo: true,
	},
	SCATTER: {
		id: 7509,
		name: 'Scatter',
		icon: iconUrl(3207),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 2500,
		castTime: 5000,
		potency: 120, // Increase White and black by 3
		breaksCombo: true,
	},
	MOULINET: {
		id: 7513,
		name: 'Moulinet',
		icon: iconUrl(3215),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 2500,
		potency: 60,
		breaksCombo: true,
	},
	ENCHANTED_MOULINET: {
		id: 7530,
		name: 'Enchanted Moulinet',
		icon: iconUrl(3228),
		onGcd: true,
		cooldown: 1500,
		potency: 130, // Costs 20 White and Black
		combo: {
			start: true,
		},
	},
	ENCHANTED_MOULINET_DEUX: {
		id: 37002,
		name: 'Enchanted Moulinet Deux',
		icon: iconUrl(3239),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 2500,
		potency: 140,
		combo: {
			from: 7530,
			potency: 140,
		},
	},
	ENCHANTED_MOULINET_TROIS: {
		id: 37003,
		name: 'Enchanted Moulinet Trois',
		icon: iconUrl(3240),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 2500,
		potency: 150,
		combo: {
			from: 37002,
			potency: 150,
			end: true,
		},
	},
	VERCURE: {
		id: 7514,
		name: 'Vercure',
		icon: iconUrl(3216),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 2500,
		castTime: 2000,
		potency: 350,
		breaksCombo: true,
	},
	VERRAISE: {
		id: 7523,
		name: 'Verraise',
		icon: iconUrl(3221),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		cooldown: 2500,
		castTime: 10000,
		breaksCombo: true,
	},
})
