import {iconUrl} from 'data/icon'
import {ensureActions} from '../type'

export const SHARED = ensureActions({
	UNKNOWN: {
		id: 0,
		name: 'Unknown',
		// System action - red background, gold cross
		icon: iconUrl(26),
		// Using a 2.5s "cooldown" so it sort-of-fits as a GCD and cooldown.
		// We don't actually know what it was.
		cooldown: 2500,
		statusesApplied: [],
	},
	SPRINT: {
		id: 3,
		name: 'Sprint',
		icon: iconUrl(104),
	},
	ATTACK: {
		id: 7,
		name: 'Attack',
		icon: iconUrl(101),
		autoAttack: true,
	},
	SHOT: {
		id: 8,
		name: 'Shot',
		icon: iconUrl(101),
		autoAttack: true,
	},
})
