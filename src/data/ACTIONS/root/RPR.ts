import {Attribute} from 'event'
import {ensureActions} from '../type'

export const RPR = ensureActions({
	// -----
	// Player GCDs
	// -----

	SLICE: {
		id: 0,
		name: 'Slice',
		icon: '',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	WAXING_SLICE: {
		id: 0,
		name: 'Waxing Slice',
		icon: '',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 0, // slice
		},
	},

	INFERNAL_SLICE: {
		id: 0,
		name: 'Infernal Slice',
		icon: '',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 0, // waxing slice
		},
	},

	SHADOW_OF_DEATH: {
		id: 0,
		name: 'Shadow of Death',
		icon: '',
		onGcd: true,
		cooldownGroup: 0, // shared with whorl of death
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['DEATHS_DESIGN'],
	},

	HARPE: {
		id: 0,
		name: 'Harpe',
		icon: '',
		onGcd: true,
		castTime: 1300,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	SPINNING_SCYTHE: {
		id: 0,
		name: 'Spinning Scythe',
		icon: '',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	NIGHTMARE_SCYTHE: {
		id: 0,
		name: 'Nightmare Scythe',
		icon: '',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 0, // spinning scythe
		},
	},

	WHORL_OF_DEATH: {
		id: 0,
		name: 'Whorl of Death',
		icon: '',
		onGcd: true,
		cooldownGroup: 0, // shared with shadow of death
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['DEATHS_DESIGN'],
	},

	SOULSOW: {
		id: 0,
		name: 'Soulsow',
		icon: '',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		statusesApplied: ['SOULSOW'],
	},

	HARVEST_MOON: {
		id: 0,
		name: 'Harvest Moon',
		icon: '',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	PLENTIFUL_HARVEST: {
		id: 0,
		name: 'Plentiful Harvest',
		icon: '',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	// -----
	// Shroud Gauge GCDs
	// -----

	VOID_REAPING: {
		id: 0,
		name: 'Void Reaping',
		icon: '',
		onGcd: true,
		cooldown: 1500,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['ENHANCED_CROSS_REAPING'],
	},

	CROSS_REAPING: {
		id: 0,
		name: 'Cross Reaping',
		icon: '',
		onGcd: true,
		cooldown: 1500,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['ENHANCED_VOID_REAPING'],
	},

	GRIM_REAPING: {
		id: 0,
		name: 'Grim Reaping',
		icon: '',
		onGcd: true,
		cooldown: 1500,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	COMMUNIO: {
		id: 0,
		name: 'Communio',
		icon: '',
		onGcd: true,
		cooldown: 1500,
		castTime: 1300,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	// -----
	// Soul Gauge GCDs
	// -----

	GALLOWS: {
		id: 0,
		name: 'Gallows',
		icon: '',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['ENHANCED_GIBBET'],
	},

	GIBBET: {
		id: 0,
		name: 'Gibbet',
		icon: '',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['ENHANCED_GALLOWS'],
	},

	GUILLOTINE: {
		id: 0,
		name: 'Guillotine',
		icon: '',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	// -----
	// Player OGCDs
	// -----

	SOUL_SLICE: {
		id: 0,
		name: 'Soul Slice',
		icon: '',
		cooldown: 30000,
		cooldownGroup: 0, // shared with soul scythe
		charges: 2,
	},

	SOUL_SCYTHE: {
		id: 0,
		name: 'Soul Scythe',
		icon: '',
		cooldown: 30000,
		cooldownGroup: 0, // shared with soul slice
		charges: 2,
	},

	HELLS_INGRESS: {
		id: 0,
		name: 'Hell\'s Ingress',
		icon: '',
		cooldown: 20000,
		cooldownGroup: 0, // shared with hell's egress
	},

	HELLS_EGRESS: {
		id: 0,
		name: 'Hell\'s Egress',
		icon: '',
		cooldown: 20000,
		cooldownGroup: 0, // shared with hell's ingress
	},

	REGRESS: {
		id: 0,
		name: 'Regress',
		icon: '',
		cooldown: 10000,
	},

	ARCANE_CIRCLE: {
		id: 0,
		name: 'Arcane Circle',
		icon: '',
		cooldown: 120000,
		statusesApplied: ['CIRCLE_OF_SACRIFICE', 'BLOODSOWN_CIRCLE', 'IMMPORTAL_SACRIFICE'],
	},

	ARCANE_CREST: {
		id: 0,
		name: 'Arcane Crest',
		icon: '',
		cooldown: 30000,
		statusesApplied: ['CREST_OF_TIME_BORROWED'],
	},

	// -----
	// Shroud Gauge oGCDs
	// -----

	ENSHROUD: {
		id: 0,
		name: 'Enshroud',
		icon: '',
		cooldown: 15000,
	},

	LEMURES_SLICE: {
		id: 0,
		name: 'Lemure\'s Slice',
		icon: '',
		cooldown: 1000,
	},

	LEMURES_SCYTHE: {
		id: 0,
		name: 'Lemure\'s Scythe',
		icon: '',
		cooldown: 1000,
	},

	// -----
	// Soul Gauge oGCDs
	// -----

	GLUTTONY: {
		id: 0,
		name: 'Gluttony',
		icon: '',
		cooldown: 60000,
		statusesApplied: ['SOUL_REAVER'],
	},

	BLOOD_STALK: {
		id: 0,
		name: 'Blood Stalk',
		icon: '',
		cooldown: 1000,
		statusesApplied: ['SOUL_REAVER'],
	},

	UNVEILED_GALLOWS: {
		id: 0,
		name: 'Unveiled Gallows',
		icon: '',
		cooldown: 1000,
		statusesApplied: ['SOUL_REAVER'],
	},

	UNVEILED_GIBBET: {
		id: 0,
		name: 'Unveiled Gibbet',
		icon: '',
		cooldown: 1000,
		statusesApplied: ['SOUL_REAVER'],
	},

	GRIM_SWATHE: {
		id: 0,
		name: 'Grim Swathe',
		icon: '',
		cooldown: 1000,
		statusesApplied: ['SOUL_REAVER'],
	},
})
