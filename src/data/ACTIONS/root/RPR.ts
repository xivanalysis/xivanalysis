import {Attribute} from 'event'
import {ensureActions} from '../type'

export const RPR = ensureActions({
	// -----
	// Player GCDs
	// -----

	SLICE: {
		id: 24373,
		name: 'Slice',
		icon: 'https://xivapi.com/i/003000/003601.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	WAXING_SLICE: {
		id: 24374,
		name: 'Waxing Slice',
		icon: 'https://xivapi.com/i/003000/003602.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 24373,
		},
	},

	INFERNAL_SLICE: {
		id: 24375,
		name: 'Infernal Slice',
		icon: 'https://xivapi.com/i/003000/003603.png',
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
		icon: 'https://xivapi.com/i/003000/003606.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['DEATHS_DESIGN'],
	},

	HARPE: {
		id: 24386,
		name: 'Harpe',
		icon: 'https://xivapi.com/i/003000/003614.png',
		onGcd: true,
		castTime: 1300,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	SPINNING_SCYTHE: {
		id: 24376,
		name: 'Spinning Scythe',
		icon: 'https://xivapi.com/i/003000/003604.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	NIGHTMARE_SCYTHE: {
		id: 24377,
		name: 'Nightmare Scythe',
		icon: 'https://xivapi.com/i/003000/003605.png',
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
		icon: 'https://xivapi.com/i/003000/003607.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['DEATHS_DESIGN'],
	},

	SOULSOW: {
		id: 24387,
		name: 'Soulsow',
		icon: 'https://xivapi.com/i/003000/003615.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 5000,
		statusesApplied: ['SOULSOW'],
	},

	HARVEST_MOON: {
		id: 24388,
		name: 'Harvest Moon',
		icon: 'https://xivapi.com/i/003000/003616.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	PLENTIFUL_HARVEST: {
		id: 24385,
		name: 'Plentiful Harvest',
		icon: 'https://xivapi.com/i/003000/003613.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	// -----
	// Shroud Gauge GCDs
	// -----

	VOID_REAPING: {
		id: 24395,
		name: 'Void Reaping',
		icon: 'https://xivapi.com/i/003000/003623.png',
		onGcd: true,
		cooldown: 1500,
		statusesApplied: ['ENHANCED_CROSS_REAPING'],
	},

	CROSS_REAPING: {
		id: 24396,
		name: 'Cross Reaping',
		icon: 'https://xivapi.com/i/003000/003624.png',
		onGcd: true,
		cooldown: 1500,
		statusesApplied: ['ENHANCED_VOID_REAPING'],
	},

	GRIM_REAPING: {
		id: 24397,
		name: 'Grim Reaping',
		icon: 'https://xivapi.com/i/003000/003625.png',
		onGcd: true,
		cooldown: 1500,
	},

	COMMUNIO: {
		id: 24398,
		name: 'Communio',
		icon: 'https://xivapi.com/i/003000/003626.png',
		onGcd: true,
		castTime: 1300,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	// -----
	// Soul Gauge GCDs
	// -----

	GALLOWS: {
		id: 24383,
		name: 'Gallows',
		icon: 'https://xivapi.com/i/003000/003611.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['ENHANCED_GIBBET'],
	},

	GIBBET: {
		id: 24382,
		name: 'Gibbet',
		icon: 'https://xivapi.com/i/003000/003610.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['ENHANCED_GALLOWS'],
	},

	GUILLOTINE: {
		id: 24384,
		name: 'Guillotine',
		icon: 'https://xivapi.com/i/003000/003612.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	SOUL_SLICE: {
		id: 24380,
		name: 'Soul Slice',
		icon: 'https://xivapi.com/i/003000/003608.png',
		onGcd: true,
		cooldown: 30000,
		gcdRecast: 2500,
		cooldownGroup: 5,
		charges: 2,
	},

	SOUL_SCYTHE: {
		id: 24381,
		name: 'Soul Scythe',
		icon: 'https://xivapi.com/i/003000/003609.png',
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
		icon: 'https://xivapi.com/i/003000/003629.png',
		cooldown: 20000,
		cooldownGroup: 4,
		statusesApplied: ['ENHANCED_HARPE'],
	},

	HELLS_EGRESS: {
		id: 24402,
		name: 'Hell\'s Egress',
		icon: 'https://xivapi.com/i/003000/003630.png',
		cooldown: 20000,
		cooldownGroup: 4,
		statusesApplied: ['ENHANCED_HARPE'],
	},

	REGRESS: {
		id: 24403,
		name: 'Regress',
		icon: 'https://xivapi.com/i/003000/003631.png',
		cooldown: 10000,
	},

	ARCANE_CIRCLE: {
		id: 24405,
		name: 'Arcane Circle',
		icon: 'https://xivapi.com/i/003000/003633.png',
		cooldown: 120000,
		statusesApplied: ['ARCANE_CIRCLE', 'CIRCLE_OF_SACRIFICE', 'BLOODSOWN_CIRCLE', 'IMMORTAL_SACRIFICE'],
	},

	ARCANE_CREST: {
		id: 24404,
		name: 'Arcane Crest',
		icon: 'https://xivapi.com/i/003000/003632.png',
		cooldown: 30000,
		statusesApplied: ['CREST_OF_TIME_BORROWED'],
	},

	// -----
	// Shroud Gauge oGCDs
	// -----

	ENSHROUD: {
		id: 24394,
		name: 'Enshroud',
		icon: 'https://xivapi.com/i/003000/003622.png',
		cooldown: 15000,
		statusesApplied: ['ENSHROUDED'],
	},

	LEMURES_SLICE: {
		id: 24399,
		name: 'Lemure\'s Slice',
		icon: 'https://xivapi.com/i/003000/003627.png',
		cooldown: 1000,
	},

	LEMURES_SCYTHE: {
		id: 24400,
		name: 'Lemure\'s Scythe',
		icon: 'https://xivapi.com/i/003000/003628.png',
		cooldown: 1000,
	},

	// -----
	// Soul Gauge oGCDs
	// -----

	GLUTTONY: {
		id: 24393,
		name: 'Gluttony',
		icon: 'https://xivapi.com/i/003000/003621.png',
		cooldown: 60000,
		statusesApplied: ['SOUL_REAVER'],
	},

	BLOOD_STALK: {
		id: 24389,
		name: 'Blood Stalk',
		icon: 'https://xivapi.com/i/003000/003617.png',
		cooldown: 1000,
		statusesApplied: ['SOUL_REAVER'],
	},

	UNVEILED_GALLOWS: {
		id: 24391,
		name: 'Unveiled Gallows',
		icon: 'https://xivapi.com/i/003000/003619.png',
		statusesApplied: ['SOUL_REAVER'],
	},

	UNVEILED_GIBBET: {
		id: 24390,
		name: 'Unveiled Gibbet',
		icon: 'https://xivapi.com/i/003000/003618.png',
		statusesApplied: ['SOUL_REAVER'],
	},

	GRIM_SWATHE: {
		id: 24392,
		name: 'Grim Swathe',
		icon: 'https://xivapi.com/i/003000/003620.png',
		cooldown: 1000,
		statusesApplied: ['SOUL_REAVER'],
	},
})
