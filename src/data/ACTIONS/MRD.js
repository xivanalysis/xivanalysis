import STATUSES from 'data/STATUSES'

// Split between MRD and WAR
export default {
	// -----
	// Player GCDs
	// -----
	HEAVY_SWING: {
		id: 31,
		name: 'Heavy Swing',
		icon: 'https://xivapi.com/i/000000/000260.png',
		potency: 200,
		onGcd: true,
		combo: {
			start: true,
		},
	},

	OVERPOWER: {
		id: 41,
		name: 'Overpower',
		icon: 'https://xivapi.com/i/000000/000254.png',
		onGcd: true,
		potency: 130,
		breaksCombo: true,
	},

	TOMAHAWK: {
		id: 46,
		name: 'Tomahawk',
		icon: 'https://xivapi.com/i/000000/000261.png',
		onGcd: true,
		potency: 140,
		breaksCombo: true,
	},

	MAIM: {
		id: 37,
		name: 'Maim',
		icon: 'https://xivapi.com/i/000000/000255.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 31,
			potency: 300,
		},
	},

	STORMS_PATH: {
		id: 42,
		name: 'Storm\'s Path',
		icon: 'https://xivapi.com/i/000000/000258.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 37,
			potency: 380,
			end: true,
		},
	},

	STORMS_EYE: {
		id: 45,
		name: 'Storm\'s Eye',
		icon: 'https://xivapi.com/i/000000/000264.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 37,
			potency: 380,
			end: true,
		},
	},

	// -----
	// Player OGCDs
	// -----

	THRILL_OF_BATTLE: {
		id: 40,
		name: 'Thrill of Battle',
		icon: 'https://xivapi.com/i/000000/000263.png',
		cooldown: 90,
		onGcd: false,
		statusesApplied: [STATUSES.THRILL_OF_BATTLE],
	},

	HOLMGANG: {
		id: 43,
		name: 'Holmgang',
		icon: 'https://xivapi.com/i/000000/000266.png',
		cooldown: 240,
		onGcd: false,
		statusesApplied: [STATUSES.HOLMGANG],
	},

	VENGEANCE: {
		id: 44,
		name: 'Vengeance',
		icon: 'https://xivapi.com/i/000000/000267.png',
		cooldown: 120,
		onGcd: false,
		statusesApplied: [STATUSES.VENGEANCE],
	},
}
