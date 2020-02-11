import {ensureActions} from '../type'

// Split between PGL and MNK
export const PGL = ensureActions({
	// -----
	// Player GCDs
	// -----

	BOOTSHINE: {
		id: 53,
		name: 'Bootshine',
		icon: 'https://xivapi.com/i/000000/000208.png',
		onGcd: true,
		potency: 150,
	},

	TRUE_STRIKE: {
		id: 54,
		name: 'True Strike',
		icon: 'https://xivapi.com/i/000000/000209.png',
		onGcd: true,
		potency: 240,
	},

	SNAP_PUNCH: {
		id: 56,
		name: 'Snap Punch',
		icon: 'https://xivapi.com/i/000000/000210.png',
		onGcd: true,
	},

	TWIN_SNAKES: {
		id: 61,
		name: 'Twin Snakes',
		icon: 'https://xivapi.com/i/000000/000213.png',
		onGcd: true,
		potency: 170,
		statusesApplied: ['TWIN_SNAKES'],
	},

	ARM_OF_THE_DESTROYER: {
		id: 62,
		name: 'Arm of the Destroyer',
		icon: 'https://xivapi.com/i/000000/000215.png',
		onGcd: true,
	},

	DEMOLISH: {
		id: 66,
		name: 'Demolish',
		icon: 'https://xivapi.com/i/000000/000204.png',
		onGcd: true,
		statusesApplied: ['DEMOLISH'],
	},

	// -----
	// Player OGCDs
	// -----

	FISTS_OF_EARTH: {
		id: 60,
		name: 'Fists of Earth',
		icon: 'https://xivapi.com/i/000000/000206.png',
		cooldown: 3,
	},

	FISTS_OF_WIND: {
		id: 73,
		name: 'Fists of Wind',
		icon: 'https://xivapi.com/i/002000/002527.png',
		cooldown: 3,
	},

	MANTRA: {
		id: 65,
		name: 'Mantra',
		icon: 'https://xivapi.com/i/000000/000216.png',
		cooldown: 90,
		statusesApplied: ['MANTRA'],
	},

	PERFECT_BALANCE: {
		id: 69,
		name: 'Perfect Balance',
		icon: 'https://xivapi.com/i/000000/000217.png',
		cooldown: 120,
		statusesApplied: ['PERFECT_BALANCE'],
	},
})
