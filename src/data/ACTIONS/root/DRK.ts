import {ensureActions} from '../type'

export const DRK = ensureActions({
	// -----
	// Stances
	// -----
	GRIT: {
		id: 3629,
		name: 'Grit',
		icon: 'https://xivapi.com/i/003000/003070.png',
	},
	// -----
	// Cooldowns
	// -----
	// Personal Defensive
	DARK_MIND: {
		id: 3634,
		name: 'Dark Mind',
		icon: 'https://xivapi.com/i/003000/003076.png',
		cooldown: 60,
		statusesApplied: ['DARK_MIND'],
	},
	SHADOW_WALL: {
		id: 3636,
		name: 'Shadow Wall',
		icon: 'https://xivapi.com/i/003000/003075.png',
		cooldown: 120,
		statusesApplied: ['SHADOW_WALL'],
	},
	LIVING_DEAD: {
		id: 3638,
		name: 'Living Dead',
		icon: 'https://xivapi.com/i/003000/003077.png',
		cooldown: 300,
		statusesApplied: ['LIVING_DEAD', 'WALKING_DEAD'],
	},
	// Party Defensive
	DARK_MISSIONARY: {
		id: 16471,
		name: 'Dark Missionary',
		icon: 'https://xivapi.com/i/003000/003087.png',
		cooldown: 90,
		statusesApplied: ['DARK_MISSIONARY'],
	},
	// Resource Buffs
	BLOOD_WEAPON: {
		id: 3625,
		name: 'Blood Weapon',
		icon: 'https://xivapi.com/i/003000/003071.png',
		cooldown: 60,
		statusesApplied: ['BLOOD_WEAPON'],
	},
	THE_BLACKEST_NIGHT: {
		id: 7393,
		name: 'The Blackest Night',
		icon: 'https://xivapi.com/i/003000/003081.png',
		cooldown: 15,
		statusesApplied: ['BLACKEST_NIGHT'],
	},
	DELIRIUM: {
		id: 7390,
		name: 'Delirium',
		icon: 'https://xivapi.com/i/003000/003078.png',
		cooldown: 90,
		statusesApplied: ['DELIRIUM'],
	},
	// Damage
	PLUNGE: {
		id: 3640,
		name: 'Plunge',
		icon: 'https://xivapi.com/i/003000/003061.png',
		cooldown: 30,
		charges: 2,
	},
	CARVE_AND_SPIT: {
		id: 3643,
		name: 'Carve And Spit',
		icon: 'https://xivapi.com/i/003000/003058.png',
		cooldown: 60,
	},
	SALTED_EARTH: {
		id: 3639,
		name: 'Salted Earth',
		icon: 'https://xivapi.com/i/003000/003066.png',
		cooldown: 90,
		statusesApplied: ['SALTED_EARTH'],
	},
	ABYSSAL_DRAIN: {
		id: 3641,
		name: 'Abyssal Drain',
		icon: 'https://xivapi.com/i/003000/003064.png',
		cooldown: 60,
	},
	LIVING_SHADOW: {
		id: 16472,
		name: 'Living Shadow',
		icon: 'https://xivapi.com/i/003000/003088.png',
		cooldown: 120,
	},
	FLOOD_OF_SHADOW: {
		id: 16469,
		name: 'Flood of Shadow',
		icon: 'https://xivapi.com/i/003000/003085.png',
		cooldown: 2,
	},
	EDGE_OF_SHADOW: {
		id: 16470,
		name: 'Edge of Shadow',
		icon: 'https://xivapi.com/i/003000/003086.png',
		cooldown: 2,
	},
	// -----
	// GCDs
	// -----
	// Combo
	HARD_SLASH: {
		id: 3617,
		name: 'Hard Slash',
		icon: 'https://xivapi.com/i/003000/003051.png',
		onGcd: true,
		combo: {
			start: true,
		},
	},
	SYPHON_STRIKE: {
		id: 3623,
		name: 'Syphon Strike',
		icon: 'https://xivapi.com/i/003000/003054.png',
		onGcd: true,
		combo: {
			from: 3617,
		},
	},
	SOULEATER: {
		id: 3632,
		name: 'Souleater',
		icon: 'https://xivapi.com/i/003000/003055.png',
		onGcd: true,
		combo: {
			from: 3623,
			end: true,
		},
	},
	// AOE Combo
	UNLEASH: {
		id: 3621,
		name: 'Unleash',
		icon: 'https://xivapi.com/i/003000/003063.png',
		onGcd: true,
		combo: {
			start: true,
		},
	},
	STALWART_SOUL: {
		id: 16468,
		name: 'Stalwart Soul',
		icon: 'https://xivapi.com/i/003000/003084.png',
		onGcd: true,
		combo: {
			from: 3621,
			end: true,
		},
	},
	// Other
	UNMEND: {
		id: 3624,
		name: 'Unmend',
		icon: 'https://xivapi.com/i/003000/003062.png',
		onGcd: true,
		breaksCombo: true,
	},
	// Blood Consumers
	BLOODSPILLER: {
		id: 7392,
		name: 'Bloodspiller',
		icon: 'https://xivapi.com/i/003000/003080.png',
		onGcd: true,
		breaksCombo: false,
	},
	QUIETUS: {
		id: 7391,
		name: 'Quietus',
		icon: 'https://xivapi.com/i/003000/003079.png',
		onGcd: true,
		breaksCombo: false,
	},
	// Esteem
	ESTEEM_ABYSSAL_DRAIN: {
		id: 17904,
		name: 'Abyssal Drain',
		icon: 'https://xivapi.com/i/003000/003064.png',
	},
	ESTEEM_BLOODSPILLER: {
		id: 17909,
		name: 'Bloodspiller',
		icon: 'https://xivapi.com/i/003000/003080.png',
	},
	ESTEEM_CARVE_AND_SPIT: {
		id: 17915,
		name: 'Carve and Spit',
		icon: 'https://xivapi.com/i/003000/003058.png',
	},
	ESTEEM_EDGE_OF_SHADOW: {
		id: 17908,
		name: 'Edge of Shadow',
		icon: 'https://xivapi.com/i/003000/003086.png',
	},
	ESTEEM_FLOOD_OF_SHADOW: {
		id: 17907,
		name: 'Flood of Shadow',
		icon: 'https://xivapi.com/i/003000/003085.png',
	},
	ESTEEM_PLUNGE: {
		id: 17905,
		name: 'Plunge',
		icon: 'https://xivapi.com/i/003000/003061.png',
	},
	ESTEEM_QUIETUS: {
		id: 17906,
		name: 'Quietus',
		icon: 'https://xivapi.com/i/003000/003079.png',
	},
})
