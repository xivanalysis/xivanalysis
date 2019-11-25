export default {
	UNKNOWN: {
		id: 0,
		name: 'Unknown',
		// System action - red background, gold cross
		icon: 'https://xivapi.com/i/000000/000026.png',
		// Using a 2.5s "cooldown" so it sort-of-fits as a GCD and cooldown.
		// We don't actually know what it was.
		cooldown: 2.5,
		statusesApplied: [],
	},
	SPRINT: {
		id: 3,
		name: 'Sprint',
		icon: process.env.PUBLIC_URL + '/icon/action/sprint.png',
	},
	ATTACK: {
		id: 7,
		name: 'Attack',
		icon: 'https://xivapi.com/i/000000/000101.png',
		autoAttack: true,
	},
	SHOT: {
		id: 8,
		name: 'Shot',
		icon: 'https://xivapi.com/i/000000/000101.png',
		autoAttack: true,
	},
}
