import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions} from '../type'
import {SHARED} from './SHARED'

export const GNB = ensureActions({
	// -----
	// Player GCDs
	// -----
	KEEN_EDGE: {
		id: 16137,
		name: 'Keen Edge',
		icon: iconUrl(3401),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},
	BRUTAL_SHELL: {
		id: 16139,
		name: 'Brutal Shell',
		icon: iconUrl(3403),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 16137, // Keen Edge
		},
		statusesApplied: ['BRUTAL_SHELL'],
	},
	SOLID_BARREL: {
		id: 16145,
		name: 'Solid Barrel',
		icon: iconUrl(3409),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 16139, // Brutal Shell
			end: true,
		},
	},
	BURST_STRIKE: {
		id: 16162,
		name: 'Burst Strike',
		icon: iconUrl(3426),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},
	LIGHTNING_SHOT: {
		id: 16143,
		name: 'Lightning Shot',
		icon: iconUrl(3407),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},
	GNASHING_FANG: {
		id: 16146,
		name: 'Gnashing Fang',
		icon: iconUrl(3410),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
		cooldown: 30000,
		gcdRecast: 2500,
	},
	SAVAGE_CLAW: { // Technically combos from Gnashing Fang, but breaks combo functionality if we record it as such.
		id: 16147,
		name: 'Savage Claw',
		icon: iconUrl(3411),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},
	WICKED_TALON: { // Technically combos from Savage Claw, but breaks combo functionality if we record it as such.
		id: 16150,
		name: 'Wicked Talon',
		icon: iconUrl(3414),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},
	SONIC_BREAK: {
		id: 16153,
		name: 'Sonic Break',
		icon: iconUrl(3417),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
		cooldown: 60000,
		gcdRecast: 2500,
		statusesApplied: ['SONIC_BREAK'],
	},
	DEMON_SLICE: {
		id: 16141,
		name: 'Demon Slice',
		icon: iconUrl(3405),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},
	DEMON_SLAUGHTER: {
		id: 16149,
		name: 'Demon Slaughter',
		icon: iconUrl(3413),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 16141, // Demon Slice
			end: true,
		},
	},
	FATED_CIRCLE: {
		id: 16163,
		name: 'Fated Circle',
		icon: iconUrl(3427),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},
	DOUBLE_DOWN: {
		id: 25760,
		name: 'Double Down',
		icon: iconUrl(3432),
		onGcd: true,
		gcdRecast: 2500,
		cooldown: 60000,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	// -----
	// Player oGCDs
	// -----
	NO_MERCY: {
		id: 16138,
		name: 'No Mercy',
		icon: iconUrl(3402),
		onGcd: false,
		cooldown: 60000,
		statusesApplied: ['NO_MERCY'],
	},
	BLOODFEST: {
		id: 16164,
		name: 'Bloodfest',
		icon: iconUrl(3428),
		onGcd: false,
		cooldown: 90000,
	},
	JUGULAR_RIP: {
		id: 16156,
		name: 'Jugular Rip',
		icon: iconUrl(3420),
		onGcd: false,
		cooldown: 1000,
		cooldownGroup: 1,
	},
	ABDOMEN_TEAR: {
		id: 16157,
		name: 'Abdomen Tear',
		icon: iconUrl(3421),
		onGcd: false,
		cooldown: 1000,
		cooldownGroup: 1,
	},
	EYE_GOUGE: {
		id: 16158,
		name: 'Eye Gouge',
		icon: iconUrl(3422),
		onGcd: false,
		cooldown: 1000,
		cooldownGroup: 1,
	},
	HYPERVELOCITY: {
		id: 25759,
		name: 'Hypervelocity',
		icon: iconUrl(3431),
		onGcd: false,
		cooldown: 1000,
		cooldownGroup: 1,
	},
	DANGER_ZONE: {	// Note: upgrades to Blasting Zone at lvl 80
		id: 16144,
		name: 'Danger Zone',
		icon: iconUrl(3408),
		onGcd: false,
		cooldown: 30000,
	},
	BLASTING_ZONE: {
		id: 16165,
		name: 'Blasting Zone',
		icon: iconUrl(3429),
		onGcd: false,
		cooldown: 30000,
	},
	BOW_SHOCK: {
		id: 16159,
		name: 'Bow Shock',
		icon: iconUrl(3423),
		onGcd: false,
		cooldown: 60000,
		statusesApplied: ['BOW_SHOCK'],
	},
	ROUGH_DIVIDE: {
		id: 16154,
		name: 'Rough Divide',
		icon: iconUrl(3418),
		onGcd: false,
		cooldown: 30000,
		charges: 2,
	},
	ROYAL_GUARD: {
		id: 16142,
		name: 'Royal Guard',
		icon: iconUrl(3406),
		onGcd: false,
		cooldown: 10000,
	},

	RELEASE_ROYAL_GUARD: SHARED.UNKNOWN, // Added in patch 6.3 layer

	AURORA: {
		id: 16151,
		name: 'Aurora',
		icon: iconUrl(3415),
		onGcd: false,
		cooldown: 60000,
		statusesApplied: ['AURORA'],
	},
	SUPERBOLIDE: {
		id: 16152,
		name: 'Superbolide',
		icon: iconUrl(3416),
		onGcd: false,
		cooldown: 360000,
		statusesApplied: ['SUPERBOLIDE'],
	},
	CAMOUFLAGE: {
		id: 16140,
		name: 'Camouflage',
		icon: iconUrl(3404),
		onGcd: false,
		cooldown: 90000,
		statusesApplied: ['CAMOUFLAGE'],
	},
	NEBULA: {
		id: 16148,
		name: 'Nebula',
		icon: iconUrl(3412),
		onGcd: false,
		cooldown: 120000,
		statusesApplied: ['NEBULA'],
	},
	HEART_OF_STONE: {
		id: 16161,
		name: 'Heart of Stone',
		icon: iconUrl(3425),
		onGcd: false,
		cooldown: 25000,
		statusesApplied: ['HEART_OF_STONE'],
	},
	HEART_OF_LIGHT: {
		id: 16160,
		name: 'Heart of Light',
		icon: iconUrl(3424),
		onGcd: false,
		cooldown: 90000,
		statusesApplied: ['HEART_OF_LIGHT'],
	},
	CONTINUATION: {
		id: 16155,
		name: 'Continuation',
		icon: iconUrl(3419),
		onGcd: false,
		cooldown: 1000,
		cooldownGroup: 1,
	},
	HEART_OF_CORUNDUM: { //More like Corun Dumb!
		id: 25758,
		name: 'Heart of Corundum',
		icon: iconUrl(3430),
		onGcd: false,
		cooldown: 25000,
		statusesApplied: ['HEART_OF_CORUNDUM', 'CATHARSIS_OF_CORUNDUM'],
	},

})
