import {ensureActions} from '../type'

// tslint:disable:no-magic-numbers

export const MCH = ensureActions({
	// -----
	// Player GCDs
	// -----

	SPLIT_SHOT: {
		id: 2866,
		name: 'Split Shot',
		icon: 'https://xivapi.com/i/003000/003001.png',
		onGcd: true,
		potency: 180,
		combo: {
			start: true,
		},
	},

	SLUG_SHOT: {
		id: 2868,
		name: 'Slug Shot',
		icon: 'https://xivapi.com/i/003000/003002.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: [2866, 7411],
			potency: 260,
		},
	},

	SPREAD_SHOT: {
		id: 2870,
		name: 'Spread Shot',
		icon: 'https://xivapi.com/i/003000/003014.png',
		onGcd: true,
		breaksCombo: true,
	},

	HOT_SHOT: {
		id: 2872,
		name: 'Hot Shot',
		icon: 'https://xivapi.com/i/003000/003003.png',
		onGcd: true,
		cooldown: 40,
		gcdRecast: 2.5,
	},

	CLEAN_SHOT: {
		id: 2873,
		name: 'Clean Shot',
		icon: 'https://xivapi.com/i/003000/003004.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: [2868, 7412],
			potency: 340,
			end: true,
		},
	},

	HEATED_SPLIT_SHOT: {
		id: 7411,
		name: 'Heated Split Shot',
		icon: 'https://xivapi.com/i/003000/003031.png',
		onGcd: true,
		potency: 220,
		combo: {
			start: true,
		},
	},

	HEATED_SLUG_SHOT: {
		id: 7412,
		name: 'Heated Slug Shot',
		icon: 'https://xivapi.com/i/003000/003032.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 7411,
			potency: 330,
		},
	},

	HEATED_CLEAN_SHOT: {
		id: 7413,
		name: 'Heated Clean Shot',
		icon: 'https://xivapi.com/i/003000/003033.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 7412,
			potency: 440,
			end: true,
		},
	},

	HEAT_BLAST: {
		id: 7410,
		name: 'Heat Blast',
		icon: 'https://xivapi.com/i/003000/003030.png',
		onGcd: true,
		cooldown: 1.5,
		potency: 220,
	},

	AUTO_CROSSBOW: {
		id: 16497,
		name: 'Auto Crossbow',
		icon: 'https://xivapi.com/i/003000/003042.png',
		onGcd: true,
	},

	DRILL: {
		id: 16498,
		name: 'Drill',
		icon: 'https://xivapi.com/i/003000/003043.png',
		onGcd: true,
		cooldown: 20,
		gcdRecast: 2.5,
	},

	BIOBLASTER: {
		id: 16499,
		name: 'Bioblaster',
		icon: 'https://xivapi.com/i/003000/003044.png',
		onGcd: true,
		cooldown: 20,
		gcdRecast: 2.5,
		statusesApplied: ['BIOBLASTER'],
	},

	AIR_ANCHOR: {
		id: 16500,
		name: 'Air Anchor',
		icon: 'https://xivapi.com/i/003000/003045.png',
		onGcd: true,
		cooldown: 40,
		gcdRecast: 2.5,
	},

	// -----
	// Player OGCDs
	// -----

	REASSEMBLE: {
		id: 2876,
		name: 'Reassemble',
		icon: 'https://xivapi.com/i/003000/003022.png',
		onGcd: false,
		cooldown: 55,
		statusesApplied: ['REASSEMBLED'],
	},

	WILDFIRE: {
		id: 2878,
		name: 'Wildfire',
		icon: 'https://xivapi.com/i/003000/003018.png',
		onGcd: false,
		cooldown: 120,
		statusesApplied: ['WILDFIRE'],
	},

	DETONATOR: {
		id: 16766,
		name: 'Detonator',
		icon: 'https://xivapi.com/i/003000/003039.png',
		onGCD: false,
		cooldown: 1,
	},

	ROOK_AUTOTURRET: {
		id: 2864,
		name: 'Rook Autoturret',
		icon: 'https://xivapi.com/i/003000/003026.png',
		onGcd: false,
		cooldown: 6,
	},

	GAUSS_ROUND: {
		id: 2874,
		name: 'Gauss Round',
		icon: 'https://xivapi.com/i/003000/003005.png',
		onGcd: false,
		cooldown: 30,
		charges: 3,
	},

	HYPERCHARGE: {
		id: 17209,
		name: 'Hypercharge',
		icon: 'https://xivapi.com/i/003000/003041.png',
		onGcd: false,
		cooldown: 10,
	},

	RICOCHET: {
		id: 2890,
		name: 'Ricochet',
		icon: 'https://xivapi.com/i/003000/003017.png',
		onGcd: false,
		cooldown: 30,
		charges: 3,
	},

	BARREL_STABILIZER: {
		id: 7414,
		name: 'Barrel Stabilizer',
		icon: 'https://xivapi.com/i/003000/003034.png',
		onGcd: false,
		cooldown: 120,
	},

	ROOK_OVERDRIVE: {
		id: 7415,
		name: 'Rook Overdrive',
		icon: 'https://xivapi.com/i/003000/003035.png',
		onGcd: false,
		cooldown: 15,
	},

	FLAMETHROWER: {
		id: 7418,
		name: 'Flamethrower',
		icon: 'https://xivapi.com/i/003000/003038.png',
		onGcd: false,
		cooldown: 60,
		statusesApplied: ['FLAMETHROWER'],
	},

	TACTICIAN: {
		id: 16889,
		name: 'Tactician',
		icon: 'https://xivapi.com/i/003000/003040.png',
		onGcd: false,
		cooldown: 120,
		statusesApplied: ['TACTICIAN'],
	},

	AUTOMATON_QUEEN: {
		id: 16501,
		name: 'Automaton Queen',
		icon: 'https://xivapi.com/i/003000/003501.png',
		onGcd: false,
		cooldown: 6,
	},

	QUEEN_OVERDRIVE: {
		id: 16502,
		name: 'Queen Overdrive',
		icon: 'https://xivapi.com/i/003000/003502.png',
		onGcd: false,
		cooldown: 15,
	},

	// -----
	// Turret attacks
	// -----

	VOLLEY_FIRE: { // Rook auto attacks
		id: 2891,
		name: 'Volley Fire',
		icon: 'https://xivapi.com/i/000000/000405.png',
	},

	CHARGED_VOLLEY_FIRE: {
		id: 3588,
		name: 'Charged Volley Fire',
		icon: 'https://xivapi.com/i/000000/000405.png',
	},

	ROLLER_DASH: {
		id: 17206,
		name: 'Roller Dash',
		icon: 'https://xivapi.com/i/003000/003505.png',
		onGcd: true, // These aren't technically on -our- GCD but it makes them look nicer in the rotation display
	},

	ARM_PUNCH: {
		id: 16504,
		name: 'Arm Punch',
		icon: 'https://xivapi.com/i/003000/003504.png',
		onGcd: true,
	},

	PILE_BUNKER: {
		id: 16503,
		name: 'Pile Bunker',
		icon: 'https://xivapi.com/i/003000/003503.png',
		onGcd: true,
	},
})
