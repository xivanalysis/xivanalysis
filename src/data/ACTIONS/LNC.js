import STATUSES from 'data/STATUSES'

export default {
	// -----
	// Player GCDs
	// -----
	TRUE_THRUST: {
		id: 75,
		name: 'True Thrust',
		icon: 'https://xivapi.com/i/000000/000310.png',
		onGcd: true,
		potency: 290,
		combo: {
			start: true,
		},
	},

	VORPAL_THRUST: {
		id: 78,
		name: 'Vorpal Thrust',
		icon: 'https://xivapi.com/i/000000/000312.png',
		onGcd: true,
		potency: 140,
		combo: {
			from: [75, 16479],
			potency: 350,
		},
	},

	PIERCING_TALON: {
		id: 90,
		name: 'Piercing Talon',
		icon: 'https://xivapi.com/i/000000/000315.png',
		onGcd: true,
		potency: 150,
	},

	FULL_THRUST: {
		id: 84,
		name: 'Full Thrust',
		icon: 'https://xivapi.com/i/000000/000314.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 78,
			potency: 530,
			end: true,
		},
	},

	DISEMBOWEL: {
		id: 87,
		name: 'Disembowel',
		icon: 'https://xivapi.com/i/000000/000317.png',
		onGcd: true,
		potency: 150,
		combo: {
			from: [75, 16479],
			potency: 320,
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
			potency: 330,
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
		cooldown: 45,
		statusesApplied: [STATUSES.LIFE_SURGE],
	},

	LANCE_CHARGE: {
		id: 85,
		name: 'Lance Charge',
		icon: 'https://xivapi.com/i/000000/000309.png',
		cooldown: 90,
	},
}
