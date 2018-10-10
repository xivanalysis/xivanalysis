// Split between MRD and WAR
export default {
	// -----
	// Player GCDs
	// -----
	HEAVY_SWING: {
		id: 31,
		name: 'Heavy Swing',
		icon: 'https://xivapi.com/i/000000/000260.png',
		potency: 160,
		onGcd: true,
		combo: {
			start: true,
		},
	},

	SKULL_SUNDER: {
		id: 35,
		name: 'Skull Sunder',
		icon: 'https://xivapi.com/i/000000/000257.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 31,
			potency: 210,
		},
	},

	BUTCHERS_BLOCK: {
		id: 47,
		name: 'Butcher\'s Block',
		icon: 'https://xivapi.com/i/000000/000262.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 35,
			potency: 300,
			end: true,
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
			potency: 200,
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
			potency: 280,
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
			potency: 280,
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
		cooldown: 120,
		onGcd: false,
	},

	HOLMGANG: {
		id: 43,
		name: 'Holmgang',
		icon: 'https://xivapi.com/i/000000/000266.png',
		cooldown: 180,
		onGcd: false,
	},

	VENGEANCE: {
		id: 44,
		name: 'Vengeance',
		icon: 'https://xivapi.com/i/000000/000267.png',
		cooldown: 120,
		onGcd: false,
	},
}
