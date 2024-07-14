import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions, BonusModifier} from '../type'

export const RPR = ensureActions({
	// -----
	// Player GCDs
	// -----

	SLICE: {
		id: 24373,
		name: 'Slice',
		icon: iconUrl(3601),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	WAXING_SLICE: {
		id: 24374,
		name: 'Waxing Slice',
		icon: iconUrl(3602),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 24373,
		},
	},

	INFERNAL_SLICE: {
		id: 24375,
		name: 'Infernal Slice',
		icon: iconUrl(3603),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 24374,
			end: true,
		},
	},

	SHADOW_OF_DEATH: {
		id: 24378,
		name: 'Shadow of Death',
		icon: iconUrl(3606),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['DEATHS_DESIGN'],
	},

	HARPE: {
		id: 24386,
		name: 'Harpe',
		icon: iconUrl(3614),
		onGcd: true,
		castTime: 1300,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	SPINNING_SCYTHE: {
		id: 24376,
		name: 'Spinning Scythe',
		icon: iconUrl(3604),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	NIGHTMARE_SCYTHE: {
		id: 24377,
		name: 'Nightmare Scythe',
		icon: iconUrl(3605),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 24376,
			end: true,
		},
	},

	WHORL_OF_DEATH: {
		id: 24379,
		name: 'Whorl of Death',
		icon: iconUrl(3607),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['DEATHS_DESIGN'],
	},

	SOULSOW: {
		id: 24387,
		name: 'Soulsow',
		icon: iconUrl(3615),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 5000,
		statusesApplied: ['SOULSOW'],
	},

	HARVEST_MOON: {
		id: 24388,
		name: 'Harvest Moon',
		icon: iconUrl(3616),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	PLENTIFUL_HARVEST: {
		id: 24385,
		name: 'Plentiful Harvest',
		icon: iconUrl(3613),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: [
			'PERFECTIO_OCCULTA',
			'IDEAL_HOST',
		],
	},

	// -----
	// Shroud Gauge GCDs
	// -----

	VOID_REAPING: {
		id: 24395,
		name: 'Void Reaping',
		icon: iconUrl(3623),
		onGcd: true,
		cooldown: 1500,
		statusesApplied: ['ENHANCED_CROSS_REAPING'],
	},

	CROSS_REAPING: {
		id: 24396,
		name: 'Cross Reaping',
		icon: iconUrl(3624),
		onGcd: true,
		cooldown: 1500,
		statusesApplied: ['ENHANCED_VOID_REAPING'],
	},

	GRIM_REAPING: {
		id: 24397,
		name: 'Grim Reaping',
		icon: iconUrl(3625),
		onGcd: true,
		cooldown: 1500,
	},

	COMMUNIO: {
		id: 24398,
		name: 'Communio',
		icon: iconUrl(3626),
		onGcd: true,
		castTime: 1300,
		speedAttribute: Attribute.SPELL_SPEED,
		statusesApplied: ['PERFECTIO_PARATA'],
	},

	PERFECTIO: {
		id: 36973,
		name: 'Perfectio',
		icon: iconUrl(3638),
		onGcd: true,
	},

	// -----
	// Soul Gauge GCDs
	// -----

	GALLOWS: {
		id: 24383,
		name: 'Gallows',
		icon: iconUrl(3611),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['ENHANCED_GIBBET'],
		potencies: [{
			value: 500,
			bonusModifiers: [],
			baseModifiers: [],
		}, {
			value: 560,
			bonusModifiers: [BonusModifier.POSITIONAL],
			baseModifiers: [],
		}, {
			value: 560,
			bonusModifiers: [],
			baseModifiers: ['ENHANCED_GALLOWS'],
		}, {
			value: 620,
			bonusModifiers: [BonusModifier.POSITIONAL],
			baseModifiers: ['ENHANCED_GALLOWS'],
		}],
	},

	EXECUTIONERS_GALLOWS: {
		id: 36971,
		name: "Executioner's Gallows",
		icon: iconUrl(3636),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['ENHANCED_GIBBET'],
		potencies: [{
			value: 700,
			bonusModifiers: [],
			baseModifiers: [],
		}, {
			value: 760,
			bonusModifiers: [BonusModifier.POSITIONAL],
			baseModifiers: [],
		}, {
			value: 760,
			bonusModifiers: [],
			baseModifiers: ['ENHANCED_GALLOWS'],
		}, {
			value: 820,
			bonusModifiers: [BonusModifier.POSITIONAL],
			baseModifiers: ['ENHANCED_GALLOWS'],
		}],
	},

	GIBBET: {
		id: 24382,
		name: 'Gibbet',
		icon: iconUrl(3610),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['ENHANCED_GALLOWS'],
		potencies: [{
			value: 500,
			bonusModifiers: [],
			baseModifiers: [],
		}, {
			value: 560,
			bonusModifiers: [BonusModifier.POSITIONAL],
			baseModifiers: [],
		}, {
			value: 560,
			bonusModifiers: [],
			baseModifiers: ['ENHANCED_GIBBET'],
		}, {
			value: 620,
			bonusModifiers: [BonusModifier.POSITIONAL],
			baseModifiers: ['ENHANCED_GIBBET'],
		}],
	},

	EXECUTIONERS_GIBBET: {
		id: 36970,
		name: "Executioner's Gibbet",
		icon: iconUrl(3635),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['ENHANCED_GALLOWS'],
		potencies: [{
			value: 700,
			bonusModifiers: [],
			baseModifiers: [],
		}, {
			value: 760,
			bonusModifiers: [BonusModifier.POSITIONAL],
			baseModifiers: [],
		}, {
			value: 760,
			bonusModifiers: [],
			baseModifiers: ['ENHANCED_GIBBET'],
		}, {
			value: 820,
			bonusModifiers: [BonusModifier.POSITIONAL],
			baseModifiers: ['ENHANCED_GIBBET'],
		}],
	},

	GUILLOTINE: {
		id: 24384,
		name: 'Guillotine',
		icon: iconUrl(3612),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	EXECUTIONERS_GUILLOTINE: {
		id: 36972,
		name: "Executioner's Guillotine",
		icon: iconUrl(3637),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	SOUL_SLICE: {
		id: 24380,
		name: 'Soul Slice',
		icon: iconUrl(3608),
		onGcd: true,
		cooldown: 30000,
		gcdRecast: 2500,
		cooldownGroup: 5,
		charges: 2,
	},

	SOUL_SCYTHE: {
		id: 24381,
		name: 'Soul Scythe',
		icon: iconUrl(3609),
		onGcd: true,
		cooldown: 30000,
		gcdRecast: 2500,
		cooldownGroup: 5,
		charges: 2,
	},

	// -----
	// Player OGCDs
	// -----

	HELLS_INGRESS: {
		id: 24401,
		name: 'Hell\'s Ingress',
		icon: iconUrl(3629),
		cooldown: 20000,
		cooldownGroup: 4,
		statusesApplied: ['ENHANCED_HARPE'],
	},

	HELLS_EGRESS: {
		id: 24402,
		name: 'Hell\'s Egress',
		icon: iconUrl(3630),
		cooldown: 20000,
		cooldownGroup: 4,
		statusesApplied: ['ENHANCED_HARPE'],
	},

	REGRESS: {
		id: 24403,
		name: 'Regress',
		icon: iconUrl(3631),
		cooldown: 10000,
	},

	ARCANE_CIRCLE: {
		id: 24405,
		name: 'Arcane Circle',
		icon: iconUrl(3633),
		cooldown: 120000,
		statusesApplied: ['ARCANE_CIRCLE', 'CIRCLE_OF_SACRIFICE', 'BLOODSOWN_CIRCLE', 'IMMORTAL_SACRIFICE'],
	},

	ARCANE_CREST: {
		id: 24404,
		name: 'Arcane Crest',
		icon: iconUrl(3632),
		cooldown: 30000,
		statusesApplied: ['CREST_OF_TIME_BORROWED'],
	},

	// -----
	// Shroud Gauge oGCDs
	// -----

	ENSHROUD: {
		id: 24394,
		name: 'Enshroud',
		icon: iconUrl(3622),
		cooldown: 15000,
		statusesApplied: ['ENSHROUDED'],
	},

	LEMURES_SLICE: {
		id: 24399,
		name: 'Lemure\'s Slice',
		icon: iconUrl(3627),
		cooldown: 1000,
	},

	LEMURES_SCYTHE: {
		id: 24400,
		name: 'Lemure\'s Scythe',
		icon: iconUrl(3628),
		cooldown: 1000,
	},

	SACRIFICIUM: {
		id: 36969,
		name: 'Sacrificium',
		icon: iconUrl(3634),
		cooldown: 1000,
	},

	// -----
	// Soul Gauge oGCDs
	// Note:
	//  all of these grant Reaver, but we only keep it on Gluttony since that's the only real use at level cap
	// -----

	GLUTTONY: {
		id: 24393,
		name: 'Gluttony',
		icon: iconUrl(3621),
		cooldown: 60000,
		statusesApplied: [
			'SOUL_REAVER',
			'EXECUTIONER',
		],
	},

	BLOOD_STALK: {
		id: 24389,
		name: 'Blood Stalk',
		icon: iconUrl(3617),
		cooldown: 1000,
		statusesApplied: ['SOUL_REAVER'],
	},

	UNVEILED_GALLOWS: {
		id: 24391,
		name: 'Unveiled Gallows',
		icon: iconUrl(3619),
		cooldown: 1000,
	},

	UNVEILED_GIBBET: {
		id: 24390,
		name: 'Unveiled Gibbet',
		icon: iconUrl(3618),
		cooldown: 1000,
	},

	GRIM_SWATHE: {
		id: 24392,
		name: 'Grim Swathe',
		icon: iconUrl(3620),
		cooldown: 1000,
		statusesApplied: ['SOUL_REAVER'],
	},
})
