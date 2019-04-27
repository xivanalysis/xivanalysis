export default {
	// -----
	// Player GCDs
	// -----
	TRUE_THRUST: {
		id: 75,
		name: 'True Thrust',
		icon: 'https://xivapi.com/i/000000/000310.png',
		onGcd: true,
		potency: 160,
		combo: {
			start: true,
		},
	},

	VORPAL_THRUST: {
		id: 78,
		name: 'Vorpal Thrust',
		icon: 'https://xivapi.com/i/000000/000312.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 75,
			potency: 250,
		},
	},

	IMPULSE_DRIVE: {
		id: 81,
		name: 'Impulse Drive',
		icon: 'https://xivapi.com/i/000000/000313.png',
		onGcd: true,
		potency: 200,
		combo: {
			start: true,
		},
	},

	HEAVY_THRUST: {
		id: 79,
		name: 'Heavy Thrust',
		icon: 'https://xivapi.com/i/000000/000311.png',
		onGcd: true,
		potency: 150,
	},

	PIERCING_TALON: {
		id: 90,
		name: 'Piercing Talon',
		icon: 'https://xivapi.com/i/000000/000315.png',
		onGcd: true,
	},

	FULL_THRUST: {
		id: 84,
		name: 'Full Thrust',
		icon: 'https://xivapi.com/i/000000/000314.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 78,
			potency: 450,
			end: true,
		},
	},

	DISEMBOWEL: {
		id: 87,
		name: 'Disembowel',
		icon: 'https://xivapi.com/i/000000/000317.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 81,
			potency: 240,
		},
	},

	CHAOS_THRUST: {
		id: 88,
		name: 'Chaos Thrust',
		icon: 'https://xivapi.com/i/000000/000308.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 87,
			potency: 280,
			end: true,
		},
	},

	// -----
	// Player OGCDs
	// -----
	LIFE_SURGE: {
		id: 83,
		name: 'Life Surge',
		icon: 'https://xivapi.com/i/000000/000304.png',
		cooldown: 50000,
	},

	BLOOD_FOR_BLOOD: {
		id: 85,
		name: 'Blood for Blood',
		icon: 'https://xivapi.com/i/000000/000309.png',
		cooldown: 80000,
	},
}
