import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'
import {SHARED} from './SHARED'

export const WAR = ensureStatuses({
	DEFIANCE: {
		id: 91,
		name: 'Defiance',
		icon: iconUrl(12551),
	},

	SURGING_TEMPEST: {
		id: 2677,
		name: 'Surging Tempest',
		icon: iconUrl(12561),
		duration: 60000,
	},

	EQUILIBRIUM: {
		id: 2681,
		name: 'Equilibrium',
		icon: iconUrl(12565),
		duration: 15000,
	},

	THRILL_OF_BATTLE: {
		id: 87,
		name: 'Thrill Of Battle',
		icon: iconUrl(10254),
		duration: 10000,
	},

	HOLMGANG: {
		id: 409,
		name: 'Holmgang',
		icon: iconUrl(10266),
		duration: 10000,
	},

	VENGEANCE: {
		id: 89,
		name: 'Vengeance',
		icon: iconUrl(10256),
		duration: 15000,
	},

	BLOODWHETTING: {
		id: 2678,
		name: 'Bloodwhetting',
		icon: iconUrl(12562),
		duration: 8000,
	},

	STEM_THE_FLOW: {
		id: 2679,
		name: 'Stem the Flow',
		icon: iconUrl(12563),
		duration: 4000,
	},

	STEM_THE_TIDE: {
		id: 2680,
		name: 'Stem the Tide',
		icon: iconUrl(12564),
		duration: 20000,
	},

	NASCENT_FLASH: {
		id: 1857,
		name: 'Nascent Flash',
		icon: iconUrl(12558),
		duration: 8000,
	},

	NASCENT_GLINT: {
		id: 1858,
		name: 'Nascent Glint',
		icon: iconUrl(12559),
		duration: 8000,
	},

	SHAKE_IT_OFF: {
		id: 1457,
		name: 'Shake It Off',
		icon: iconUrl(12557),
		duration: 15000,
	},

	SHAKE_IT_OFF_OVER_TIME: SHARED.UNKNOWN, // Added in patch 6.3 layer

	NASCENT_CHAOS: {
		id: 1897,
		name: 'Nascent Chaos',
		icon: iconUrl(12560),
		duration: 30000,
	},

	INNER_RELEASE: {
		id: 1177,
		name: 'Inner Release',
		icon: iconUrl(17247),
		duration: 15000,
		stacksApplied: 3,
	},

	PRIMAL_REND_READY: {
		id: 2624,
		name: 'Primal Rend Ready',
		icon: iconUrl(12566),
		duration: 30000,
	},
})
