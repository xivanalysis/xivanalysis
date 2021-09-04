import {Attribute} from 'event'
import {ensureActions} from '../type'

export const GNB = ensureActions({
	// -----
	// Player GCDs
	// -----
	KEEN_EDGE: {
		id: 16137,
		name: 'Keen Edge',
		icon: 'https://xivapi.com/i/003000/003401.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 200,
		combo: {
			start: true,
		},
	},
	BRUTAL_SHELL: {
		id: 16139,
		name: 'Brutal Shell',
		icon: 'https://xivapi.com/i/003000/003403.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 100,
		combo: {
			from: 16137, // Keen Edge
			potency: 300,
		},
		statusesApplied: ['BRUTAL_SHELL'],
	},
	SOLID_BARREL: {
		id: 16145,
		name: 'Solid Barrel',
		icon: 'https://xivapi.com/i/003000/003409.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 100,
		combo: {
			from: 16139, // Brutal Shell
			potency: 400,
			end: true,
		},
	},
	BURST_STRIKE: {
		id: 16162,
		name: 'Burst Strike',
		icon: 'https://xivapi.com/i/003000/003426.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
		potency: 500,
	},
	LIGHTNING_SHOT: {
		id: 16143,
		name: 'Lightning Shot',
		icon: 'https://xivapi.com/i/003000/003407.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: true,
		potency: 150,
	},
	GNASHING_FANG: {
		id: 16146,
		name: 'Gnashing Fang',
		icon: 'https://xivapi.com/i/003000/003410.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
		potency: 450,
		cooldown: 30000,
		gcdRecast: 2500,
	},
	SAVAGE_CLAW: { // Technically combos from Gnashing Fang, but breaks combo functionality if we record it as such.
		id: 16147,
		name: 'Savage Claw',
		icon: 'https://xivapi.com/i/003000/003411.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
		potency: 550,
	},
	WICKED_TALON: { // Technically combos from Savage Claw, but breaks combo functionality if we record it as such.
		id: 16150,
		name: 'Wicked Talon',
		icon: 'https://xivapi.com/i/003000/003414.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
		potency: 650,
	},
	SONIC_BREAK: {
		id: 16153,
		name: 'Sonic Break',
		icon: 'https://xivapi.com/i/003000/003417.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
		potency: 300,
		cooldown: 60000,
		gcdRecast: 2500,
		statusesApplied: ['SONIC_BREAK'],
	},
	DEMON_SLICE: {
		id: 16141,
		name: 'Demon Slice',
		icon: 'https://xivapi.com/i/003000/003405.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 150,
		combo: {
			start: true,
		},
	},
	DEMON_SLAUGHTER: {
		id: 16149,
		name: 'Demon Slaughter',
		icon: 'https://xivapi.com/i/003000/003413.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		potency: 100,
		combo: {
			from: 16141, // Demon Slice
			potency: 250,
			end: true,
		},
	},
	FATED_CIRCLE: {
		id: 16163,
		name: 'Fated Circle',
		icon: 'https://xivapi.com/i/003000/003427.png',
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
		potency: 320,
	},

	// -----
	// Player oGCDs
	// -----
	NO_MERCY: {
		id: 16138,
		name: 'No Mercy',
		icon: 'https://xivapi.com/i/003000/003402.png',
		onGcd: false,
		cooldown: 60000,
		statusesApplied: ['NO_MERCY'],
	},
	BLOODFEST: {
		id: 16164,
		name: 'Bloodfest',
		icon: 'https://xivapi.com/i/003000/003428.png',
		onGcd: false,
		cooldown: 90000,
	},
	JUGULAR_RIP: {
		id: 16156,
		name: 'Jugular Rip',
		icon: 'https://xivapi.com/i/003000/003420.png',
		onGcd: false,
		cooldown: 1000,
		cooldownGroup: 1,
	},
	ABDOMEN_TEAR: {
		id: 16157,
		name: 'Abdomen Tear',
		icon: 'https://xivapi.com/i/003000/003421.png',
		onGcd: false,
		cooldown: 1000,
		cooldownGroup: 1,
	},
	EYE_GOUGE: {
		id: 16158,
		name: 'Eye Gouge',
		icon: 'https://xivapi.com/i/003000/003422.png',
		onGcd: false,
		cooldown: 1000,
		cooldownGroup: 1,
	},
	DANGER_ZONE: {	// Note: upgrades to Blasting Zone at lvl 80
		id: 16144,
		name: 'Danger Zone',
		icon: 'https://xivapi.com/i/003000/003408.png',
		onGcd: false,
		cooldown: 30000,
	},
	BLASTING_ZONE: {
		id: 16165,
		name: 'Blasting Zone',
		icon: 'https://xivapi.com/i/003000/003429.png',
		onGcd: false,
		cooldown: 30000,
	},
	BOW_SHOCK: {
		id: 16159,
		name: 'Bow Shock',
		icon: 'https://xivapi.com/i/003000/003423.png',
		onGcd: false,
		cooldown: 60000,
		statusesApplied: ['BOW_SHOCK'],
	},
	ROUGH_DIVIDE: {
		id: 16154,
		name: 'Rough Divide',
		icon: 'https://xivapi.com/i/003000/003418.png',
		onGcd: false,
		cooldown: 30000,
		charges: 2,
	},
	ROYAL_GUARD: {
		id: 16142,
		name: 'Royal Guard',
		icon: 'https://xivapi.com/i/003000/003406.png',
		onGcd: false,
		cooldown: 10000,
	},
	AURORA: {
		id: 16151,
		name: 'Aurora',
		icon: 'https://xivapi.com/i/003000/003415.png',
		onGcd: false,
		cooldown: 60000,
		statusesApplied: ['AURORA'],
	},
	SUPERBOLIDE: {
		id: 16152,
		name: 'Superbolide',
		icon: 'https://xivapi.com/i/003000/003416.png',
		onGcd: false,
		cooldown: 360000,
		statusesApplied: ['SUPERBOLIDE'],
	},
	CAMOUFLAGE: {
		id: 16140,
		name: 'Camouflage',
		icon: 'https://xivapi.com/i/003000/003404.png',
		onGcd: false,
		cooldown: 90000,
		statusesApplied: ['CAMOUFLAGE'],
	},
	NEBULA: {
		id: 16148,
		name: 'Nebula',
		icon: 'https://xivapi.com/i/003000/003412.png',
		onGcd: false,
		cooldown: 120000,
		statusesApplied: ['NEBULA'],
	},
	HEART_OF_STONE: {
		id: 16161,
		name: 'Heart of Stone',
		icon: 'https://xivapi.com/i/003000/003425.png',
		onGcd: false,
		cooldown: 25000,
		statusesApplied: ['HEART_OF_STONE'],
	},
	HEART_OF_LIGHT: {
		id: 16160,
		name: 'Heart of Light',
		icon: 'https://xivapi.com/i/003000/003424.png',
		onGcd: false,
		cooldown: 90000,
		statusesApplied: ['HEART_OF_LIGHT'],
	},
	CONTINUATION: {
		id: 16155,
		name: 'Continuation',
		icon: 'https://xivapi.com/i/003000/003419.png',
		onGcd: false,
		cooldown: 1000,
		cooldownGroup: 1,
	},
})
