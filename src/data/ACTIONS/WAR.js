import STATUSES from 'data/STATUSES'

export default {
	// -----
	// Player GCDs
	// -----

	STEEL_CYCLONE: {
		id: 51,
		name: 'Steel Cyclone',
		icon: 'https://xivapi.com/i/002000/002552.png',
		onGcd: true,
		potency: 220,
		breaksCombo: false,
	},

	DECIMATE: {
		id: 3550,
		name: 'Decimate',
		icon: 'https://xivapi.com/i/002000/002558.png',
		onGcd: true,
		potency: 250,
		breaksCombo: false,
	},

	MYTHRIL_TEMPEST: {
		id: 16462,
		name: 'Mythril Tempest',
		icon: 'https://xivapi.com/i/002000/002565.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 41,
			potency: 200,
		},
	},

	FELL_CLEAVE: {
		id: 3549,
		name: 'Fell Cleave',
		icon: 'https://xivapi.com/i/002000/002557.png',
		onGcd: true,
		potency: 590,
		breaksCombo: false,
	},

	INNER_BEAST: {
		id: 49,
		name: 'Inner Beast',
		icon: 'https://xivapi.com/i/002000/002553.png',
		onGcd: true,
		potency: 350,
		breaksCombo: false,
	},

	INNER_CHAOS: {
		id: 16465,
		name: 'Inner Chaos',
		icon: 'https://xivapi.com/i/002000/002568.png',
		onGcd: true,
		potency: 920,
		breaksCombo: false,
	},

	CHAOTIC_CYCLONE: {
		id: 16463,
		name: 'Chaotic Cyclone',
		icon: 'https://xivapi.com/i/002000/002566.png',
		onGcd: true,
		potency: 400,
		breaksCombo: false,
	},

	// -----
	// Player OGCDs
	// -----

	RAW_INTUITION: {
		id: 3551,
		name: 'Raw Intuition',
		icon: 'https://xivapi.com/i/002000/002559.png',
		cooldown: 25,
		onGcd: false,
		statusesApplied: [STATUSES.RAW_INTUITION],
	},

	SHAKE_IT_OFF: {
		id: 7388,
		name: 'Shake It Off',
		icon: 'https://xivapi.com/i/002000/002563.png',
		cooldown: 90,
		onGcd: false,
		statusesApplied: [STATUSES.SHAKE_IT_OFF],
	},

	ONSLAUGHT: {
		id: 7386,
		name: 'Onslaught',
		icon: 'https://xivapi.com/i/002000/002561.png',
		cooldown: 10,
		potency: 100,
		onGcd: false,
	},

	UPHEAVAL: {
		id: 7387,
		name: 'Upheaval',
		icon: 'https://xivapi.com/i/002000/002562.png',
		cooldown: 30,
		potency: 450,
		onGcd: false,
	},

	EQUILIBRIUM: {
		id: 3552,
		name: 'Equilibrium',
		icon: 'https://xivapi.com/i/002000/002560.png',
		cooldown: 60,
		onGcd: false,
	},

	DEFIANCE: {
		id: 48,
		name: 'Defiance',
		icon: 'https://xivapi.com/i/002000/002551.png',
		cooldown: 10,
		cooldownGroup: 1,
		onGcd: false,
	},

	INNER_RELEASE: {
		id: 7389,
		name: 'Inner Release',
		icon: 'https://xivapi.com/i/002000/002564.png',
		cooldown: 90,
		onGcd: false,
		statusesApplied: [STATUSES.INNER_RELEASE],
	},

	INFURIATE: {
		id: 52,
		name: 'Infuriate',
		icon: 'https://xivapi.com/i/002000/002555.png',
		cooldown: 60,
		onGcd: false,
	},

	NASCENT_FLASH: {
		id: 16464,
		name: 'Nascent Flash',
		icon: 'https://https://xivapi.com/i/002000/002567.png',
		cooldown: 25,
		cooldownGroup: 9,
		statusesApplied: [STATUSES.NASCENT_FLASH],
	},
}
