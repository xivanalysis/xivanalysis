import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions} from '../type'

const MCH_COOLDOWN_GROUP = {
	DRILL: 16498,
}

export const MCH = ensureActions({
	// -----
	// Player GCDs
	// -----

	SPLIT_SHOT: {
		id: 2866,
		name: 'Split Shot',
		icon: iconUrl(3001),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	SLUG_SHOT: {
		id: 2868,
		name: 'Slug Shot',
		icon: iconUrl(3002),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [2866, 7411],
		},
	},

	SPREAD_SHOT: {
		id: 2870,
		name: 'Spread Shot',
		icon: iconUrl(3014),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: true,
	},

	HOT_SHOT: {
		id: 2872,
		name: 'Hot Shot',
		icon: iconUrl(3003),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 40000,
		gcdRecast: 2500,
	},

	CLEAN_SHOT: {
		id: 2873,
		name: 'Clean Shot',
		icon: iconUrl(3004),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [2868, 7412],
			end: true,
		},
	},

	HEATED_SPLIT_SHOT: {
		id: 7411,
		name: 'Heated Split Shot',
		icon: iconUrl(3031),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	HEATED_SLUG_SHOT: {
		id: 7412,
		name: 'Heated Slug Shot',
		icon: iconUrl(3032),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 7411,
		},
	},

	HEATED_CLEAN_SHOT: {
		id: 7413,
		name: 'Heated Clean Shot',
		icon: iconUrl(3033),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 7412,
			end: true,
		},
	},

	HEAT_BLAST: {
		id: 7410,
		name: 'Heat Blast',
		icon: iconUrl(3030),
		onGcd: true,
		cooldown: 1500,
	},

	AUTO_CROSSBOW: {
		id: 16497,
		name: 'Auto Crossbow',
		icon: iconUrl(3042),
		onGcd: true,
	},

	DRILL: {
		id: 16498,
		name: 'Drill',
		icon: iconUrl(3043),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 20000,
		cooldownGroup: MCH_COOLDOWN_GROUP.DRILL,
		gcdRecast: 2500,
	},

	BIOBLASTER: {
		id: 16499,
		name: 'Bioblaster',
		icon: iconUrl(3044),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 20000,
		cooldownGroup: MCH_COOLDOWN_GROUP.DRILL,
		gcdRecast: 2500,
		statusesApplied: ['BIOBLASTER'],
	},

	AIR_ANCHOR: {
		id: 16500,
		name: 'Air Anchor',
		icon: iconUrl(3045),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 40000,
		gcdRecast: 2500,
	},

	SCATTERGUN: {
		id: 25786,
		name: 'Scattergun',
		icon: iconUrl(3046),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: true,
	},

	CHAIN_SAW: {
		id: 25788,
		name: 'Chain Saw',
		icon: iconUrl(3048),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		cooldown: 60000,
		gcdRecast: 2500,
	},

	// -----
	// Player OGCDs
	// -----

	REASSEMBLE: {
		id: 2876,
		name: 'Reassemble',
		icon: iconUrl(3022),
		onGcd: false,
		cooldown: 55000,
		charges: 2,
		statusesApplied: ['REASSEMBLED'],
	},

	WILDFIRE: {
		id: 2878,
		name: 'Wildfire',
		icon: iconUrl(3018),
		onGcd: false,
		cooldown: 120000,
		statusesApplied: ['WILDFIRE_SELF'],
	},

	DETONATOR: {
		id: 16766,
		name: 'Detonator',
		icon: iconUrl(3039),
		onGCD: false,
		cooldown: 1000,
	},

	ROOK_AUTOTURRET: {
		id: 2864,
		name: 'Rook Autoturret',
		icon: iconUrl(3026),
		onGcd: false,
		cooldown: 6000,
	},

	GAUSS_ROUND: {
		id: 2874,
		name: 'Gauss Round',
		icon: iconUrl(3005),
		onGcd: false,
		cooldown: 30000,
		charges: 3,
	},

	HYPERCHARGE: {
		id: 17209,
		name: 'Hypercharge',
		icon: iconUrl(3041),
		onGcd: false,
		cooldown: 10000,
		statusesApplied: ['OVERHEATED'],
	},

	RICOCHET: {
		id: 2890,
		name: 'Ricochet',
		icon: iconUrl(3017),
		onGcd: false,
		cooldown: 30000,
		charges: 3,
	},

	BARREL_STABILIZER: {
		id: 7414,
		name: 'Barrel Stabilizer',
		icon: iconUrl(3034),
		onGcd: false,
		cooldown: 120000,
	},

	ROOK_OVERDRIVE: {
		id: 7415,
		name: 'Rook Overdrive',
		icon: iconUrl(3035),
		onGcd: false,
		cooldown: 15000,
	},

	FLAMETHROWER: {
		id: 7418,
		name: 'Flamethrower',
		icon: iconUrl(3038),
		onGcd: true,
		cooldown: 60000,
		statusesApplied: ['FLAMETHROWER'],
	},

	TACTICIAN: {
		id: 16889,
		name: 'Tactician',
		icon: iconUrl(3040),
		onGcd: false,
		cooldown: 90000,
		statusesApplied: ['TACTICIAN'],
	},

	DISMANTLE: {
		id: 2887,
		name: 'Dismantle',
		icon: iconUrl(3011),
		onGcd: false,
		cooldown: 120000,
	},

	AUTOMATON_QUEEN: {
		id: 16501,
		name: 'Automaton Queen',
		icon: iconUrl(3501),
		onGcd: false,
		cooldown: 6000,
	},

	QUEEN_OVERDRIVE: {
		id: 16502,
		name: 'Queen Overdrive',
		icon: iconUrl(3502),
		onGcd: false,
		cooldown: 15000,
	},

	// -----
	// Turret attacks
	// -----

	VOLLEY_FIRE: { // Rook auto attacks
		id: 2891,
		name: 'Volley Fire',
		icon: iconUrl(405),
	},

	CHARGED_VOLLEY_FIRE: {
		id: 3588,
		name: 'Charged Volley Fire',
		icon: iconUrl(405),
	},

	ROLLER_DASH: {
		id: 17206,
		name: 'Roller Dash',
		icon: iconUrl(3505),
		onGcd: true, // These aren't technically on -our- GCD but it makes them look nicer in the rotation display
		speedAttribute: Attribute.SKILL_SPEED,
	},

	ARM_PUNCH: {
		id: 16504,
		name: 'Arm Punch',
		icon: iconUrl(3504),
		onGcd: true,
	},

	PILE_BUNKER: {
		id: 16503,
		name: 'Pile Bunker',
		icon: iconUrl(3503),
	},

	CROWNED_COLLIDER: {
		id: 25787,
		name: 'Crowned Collider',
		icon: iconUrl(3047),
	},
})
