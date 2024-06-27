import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions} from '../type'

export const DRK = ensureActions({
	// -----
	// Stances
	// -----
	GRIT: {
		id: 3629,
		name: 'Grit',
		icon: iconUrl(3070),
		cooldown: 2000,
	},

	RELEASE_GRIT: {
		id: 32067,
		name: 'Release Grit',
		icon: 'https://xivapi.com/i/003000/003092.png',
		onGcd: false,
		cooldown: 1000,
	},

	// -----
	// Cooldowns
	// -----
	// Personal Defensive
	DARK_MIND: {
		id: 3634,
		name: 'Dark Mind',
		icon: iconUrl(3076),
		cooldown: 60000,
		statusesApplied: ['DARK_MIND'],
	},
	SHADOW_WALL: {
		id: 3636,
		name: 'Shadow Wall',
		icon: iconUrl(3075),
		cooldown: 120000,
		statusesApplied: ['SHADOW_WALL'],
	},
	LIVING_DEAD: {
		id: 3638,
		name: 'Living Dead',
		icon: iconUrl(3077),
		cooldown: 300000,
		statusesApplied: ['LIVING_DEAD', 'WALKING_DEAD'],
	},
	OBLATION: {
		id: 25754,
		name: 'Oblation',
		icon: iconUrl(3089),
		cooldown: 60000,
		statusesApplied: ['OBLATION'],
		charges: 2,
	},
	// Party Defensive
	DARK_MISSIONARY: {
		id: 16471,
		name: 'Dark Missionary',
		icon: iconUrl(3087),
		cooldown: 90000,
		statusesApplied: ['DARK_MISSIONARY'],
	},
	// Resource Buffs
	BLOOD_WEAPON: {
		id: 3625,
		name: 'Blood Weapon',
		icon: iconUrl(3071),
		cooldown: 60000,
		statusesApplied: ['BLOOD_WEAPON'],
	},
	THE_BLACKEST_NIGHT: {
		id: 7393,
		name: 'The Blackest Night',
		icon: iconUrl(3081),
		cooldown: 15000,
		statusesApplied: ['BLACKEST_NIGHT'],
	},
	DELIRIUM: {
		id: 7390,
		name: 'Delirium',
		icon: iconUrl(3078),
		cooldown: 60000,
		statusesApplied: ['DELIRIUM'],
	},
	// Damage
	PLUNGE: {
		id: 3640,
		name: 'Plunge',
		icon: iconUrl(3061),
		cooldown: 30000,
		charges: 2,
	},
	CARVE_AND_SPIT: {
		id: 3643,
		name: 'Carve and Spit',
		icon: iconUrl(3058),
		cooldown: 60000,
		cooldownGroup: 14,
	},
	SALTED_EARTH: {
		id: 3639,
		name: 'Salted Earth',
		icon: iconUrl(3066),
		cooldown: 90000,
		statusesApplied: ['SALTED_EARTH'],
	},
	ABYSSAL_DRAIN: {
		id: 3641,
		name: 'Abyssal Drain',
		icon: iconUrl(3064),
		cooldown: 60000,
		cooldownGroup: 14,
	},
	LIVING_SHADOW: {
		id: 16472,
		name: 'Living Shadow',
		icon: iconUrl(3088),
		cooldown: 120000,
	},
	FLOOD_OF_SHADOW: {
		id: 16469,
		name: 'Flood of Shadow',
		icon: iconUrl(3085),
		cooldown: 2000,
	},
	EDGE_OF_SHADOW: {
		id: 16470,
		name: 'Edge of Shadow',
		icon: iconUrl(3086),
		cooldown: 2000,
	},
	SALT_AND_DARKNESS: {
		id: 25755,
		name: 'Salt and Darkness',
		icon: iconUrl(3090),
		cooldown: 20000,
	},
	SALT_AND_DARKNESS_DAMAGE: {
		id: 25756,
		name: 'Salt and Darkness',
		icon: iconUrl(3090),
		cooldown: 20000,
	},
	SHADOWBRINGER: {
		id: 25757,
		name: 'Shadowbringer',
		icon: iconUrl(3091),
		cooldown: 60000,
		charges: 2,
	},
	// -----
	// GCDs
	// -----
	// Combo
	HARD_SLASH: {
		id: 3617,
		name: 'Hard Slash',
		icon: iconUrl(3051),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},
	SYPHON_STRIKE: {
		id: 3623,
		name: 'Syphon Strike',
		icon: iconUrl(3054),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 3617,
		},
	},
	SOULEATER: {
		id: 3632,
		name: 'Souleater',
		icon: iconUrl(3055),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: 3623,
			end: true,
		},
	},
	// AOE Combo
	UNLEASH: {
		id: 3621,
		name: 'Unleash',
		icon: iconUrl(3063),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		combo: {
			start: true,
		},
	},
	STALWART_SOUL: {
		id: 16468,
		name: 'Stalwart Soul',
		icon: iconUrl(3084),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		combo: {
			from: 3621,
			end: true,
		},
	},
	// Other
	UNMEND: {
		id: 3624,
		name: 'Unmend',
		icon: iconUrl(3062),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		breaksCombo: false,
	},
	// Blood Consumers
	BLOODSPILLER: {
		id: 7392,
		name: 'Bloodspiller',
		icon: iconUrl(3080),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},
	QUIETUS: {
		id: 7391,
		name: 'Quietus',
		icon: iconUrl(3079),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},
	// Esteem
	ESTEEM_ABYSSAL_DRAIN: {
		id: 17904,
		name: 'Abyssal Drain',
		icon: iconUrl(3064),
	},
	ESTEEM_BLOODSPILLER: {
		id: 17909,
		name: 'Bloodspiller',
		icon: iconUrl(3080),
	},
	ESTEEM_CARVE_AND_SPIT: {
		id: 17915,
		name: 'Carve and Spit',
		icon: iconUrl(3058),
	},
	ESTEEM_EDGE_OF_SHADOW: {
		id: 17908,
		name: 'Edge of Shadow',
		icon: iconUrl(3086),
	},
	ESTEEM_FLOOD_OF_SHADOW: {
		id: 17907,
		name: 'Flood of Shadow',
		icon: iconUrl(3085),
	},
	ESTEEM_PLUNGE: {
		id: 17905,
		name: 'Plunge',
		icon: iconUrl(3061),
	},
	ESTEEM_QUIETUS: {
		id: 17906,
		name: 'Quietus',
		icon: iconUrl(3079),
	},
	ESTEEM_SHADOWBRINGER: {
		id: 25881,
		name: 'Shadowbringer',
		icon: iconUrl(3091),
	},
})
