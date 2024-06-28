import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'

export const ENEMY = ensureStatuses({
	// Put enemy-specific statuses that need to be checked here

	// Temporal Displacements from TEA
	TEMPORAL_DISPLACEMENT_INTERMISSION: {
		id: 1119,
		name: 'Temporal Displacement',
		icon: iconUrl(15579),
	},
	TEMPORAL_DISPLACEMENT_ENRAGE: {
		id: 2165,
		name: 'Temporal Displacement',
		icon: iconUrl(15579),
	},
})
