import {ensureActions} from '../type'

export const MNK = ensureActions({
	// -----
	// Player GCDs
	// -----

	ROCKBREAKER: {
		id: 70,
		name: 'Rockbreaker',
		icon: 'https://xivapi.com/i/002000/002529.png',
		onGcd: true,
	},

	DRAGON_KICK: {
		id: 74,
		name: 'Dragon Kick',
		icon: 'https://xivapi.com/i/002000/002528.png',
		onGcd: true,
	},

	FORM_SHIFT: {
		id: 4262,
		name: 'Form Shift',
		icon: 'https://xivapi.com/i/002000/002536.png',
		onGcd: true,
	},

	MEDITATION: {
		id: 3546,
		name: 'Meditation',
		icon: 'https://xivapi.com/i/002000/002534.png',
		onGcd: true,
		cooldown: 1.2,
	},

	FOUR_POINT_FURY: {
		id: 16473,
		name: 'Four-Point Fury',
		icon: 'https://xivapi.com/i/002000/002544.png',
		onGcd: true,
	},

	SIX_SIDED_STAR: {
		id: 16476,
		name: 'Six-Sided Star',
		icon: 'https://xivapi.com/i/002000/002547.png',
		onGcd: true,
		cooldown: 5,
	},

	// -----
	// Player OGCDs
	// -----

	SHOULDER_TACKLE: {
		id: 71,
		name: 'Shoulder Tackle',
		icon: 'https://xivapi.com/i/002000/002526.png',
		cooldown: 30,
		charges: 2,
	},

	FISTS_OF_FIRE: {
		id: 63,
		name: 'Fists of Fire',
		icon: 'https://xivapi.com/i/000000/000205.png',
		cooldown: 3,
	},

	THE_FORBIDDEN_CHAKRA: {
		id: 3547,
		name: 'The Forbidden Chakra',
		icon: 'https://xivapi.com/i/002000/002535.png',
		cooldown: 1,
	},

	ELIXIR_FIELD: {
		id: 3545,
		name: 'Elixir Field',
		icon: 'https://xivapi.com/i/002000/002533.png',
		cooldown: 30,
	},

	TORNADO_KICK: {
		id: 3543,
		name: 'Tornado Kick',
		icon: 'https://xivapi.com/i/002000/002531.png',
		cooldown: 10,
	},

	RIDDLE_OF_EARTH: {
		id: 7394,
		name: 'Riddle of Earth',
		icon: 'https://xivapi.com/i/002000/002537.png',
		cooldown: 60,
		statusesApplied: ['RIDDLE_OF_EARTH', 'EARTHS_REPLY'],
	},

	RIDDLE_OF_FIRE: {
		id: 7395,
		name: 'Riddle of Fire',
		icon: 'https://xivapi.com/i/002000/002541.png',
		cooldown: 90,
		statusesApplied: ['RIDDLE_OF_FIRE'],
	},

	BROTHERHOOD: {
		id: 7396,
		name: 'Brotherhood',
		icon: 'https://xivapi.com/i/002000/002542.png',
		cooldown: 90,
		statusesApplied: ['BROTHERHOOD', 'MEDITATIVE_BROTHERHOOD'],
	},

	ENLIGHTENMENT: {
		id: 16474,
		name: 'Enlightenment',
		icon: 'https://xivapi.com/i/002000/002545.png',
		cooldown: 1,
	},

	ANATMAN: {
		id: 16475,
		name: 'Anatman',
		icon: 'https://xivapi.com/i/002000/002546.png',
		onGcd: true,
		cooldown: 60,
		gcdRecast: 2.5,
		statusesApplied: ['ANATMAN'],
	},
})
