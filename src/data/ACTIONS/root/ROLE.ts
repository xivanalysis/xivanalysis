import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions} from '../type'

// Putting all role actions in one file 'cus a lot of them are shared between multiple roles
export const ROLE = ensureActions({
	// Tank Actions
	RAMPART: {
		id: 7531,
		name: 'Rampart',
		icon: iconUrl(801),
		cooldown: 90000,
		statusesApplied: ['RAMPART'],
	},

	LOW_BLOW: {
		id: 7540,
		name: 'Low Blow',
		icon: iconUrl(802),
		cooldown: 25000,
	},

	PROVOKE: {
		id: 7533,
		name: 'Provoke',
		icon: iconUrl(803),
		cooldown: 30000,
	},

	REPRISAL: {
		id: 7535,
		name: 'Reprisal',
		icon: iconUrl(806),
		cooldown: 60000,
		statusesApplied: ['REPRISAL'],
	},

	INTERJECT: {
		id: 7538,
		name: 'Interject',
		icon: iconUrl(808),
		cooldown: 30000,
	},

	SHIRK: {
		id: 7537,
		name: 'Shirk',
		icon: iconUrl(810),
		cooldown: 120000,
	},

	// Healer Actions
	ESUNA: {
		id: 7568,
		name: 'Esuna',
		icon: iconUrl(884),
		onGcd: true,
		cooldown: 2500,
		castTime: 1000,
		mpCost: 600,
		mpCostFactor: 5,
	},

	LUCID_DREAMING: {
		id: 7562,
		name: 'Lucid Dreaming',
		icon: iconUrl(865),
		cooldown: 60000,
		statusesApplied: ['LUCID_DREAMING'],
	},

	// TODO: BLU doesn't benefit from the post-90 trait (yet or at all? TBD in 2 expacs),
	// so we'll have to sort something out to make the timeline look right...
	SWIFTCAST: {
		id: 7561,
		name: 'Swiftcast',
		icon: iconUrl(866),
		cooldown: 40000,
		statusesApplied: ['SWIFTCAST'],
	},

	SURECAST: {
		id: 7559,
		name: 'Surecast',
		icon: iconUrl(869),
		cooldown: 120000,
		statusesApplied: ['SURECAST'],
	},

	RESCUE: {
		id: 7571,
		name: 'Rescue',
		icon: iconUrl(890),
		cooldown: 120000,
	},

	// Physical Ranged DPS
	SECOND_WIND: {
		id: 7541,
		name: 'Second Wind',
		icon: iconUrl(821),
		cooldown: 120000,
	},

	FOOT_GRAZE: {
		id: 7553,
		name: 'Foot Graze',
		icon: iconUrl(842),
		cooldown: 30000,
	},

	LEG_GRAZE: {
		id: 7554,
		name: 'Leg Graze',
		icon: iconUrl(843),
		cooldown: 30000,
	},

	PELOTON: {
		id: 7557,
		name: 'Peloton',
		icon: iconUrl(844),
		cooldown: 5000,
	},

	HEAD_GRAZE: {
		id: 7551,
		name: 'Head Graze',
		icon: iconUrl(848),
		cooldown: 30000,
	},

	// Magical Ranged DPS
	ADDLE: {
		id: 7560,
		name: 'Addle',
		icon: iconUrl(861),
		cooldown: 90000,
		statusesApplied: ['ADDLE'],
	},
	SLEEP: {
		id: 25880,
		name: 'Sleep',
		icon: iconUrl(871),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
		mpCost: 800,
	},

	// Melee DPS
	ARMS_LENGTH: {
		id: 7548,
		name: 'Arm\'s Length',
		icon: iconUrl(822),
		cooldown: 120000,
		statusesApplied: ['ARMS_LENGTH'],
	},

	LEG_SWEEP: {
		id: 7863,
		name: 'Leg Sweep',
		icon: iconUrl(824),
		cooldown: 40000,
	},

	BLOODBATH: {
		id: 7542,
		name: 'Bloodbath',
		icon: iconUrl(823),
		cooldown: 90000,
		statusesApplied: ['BLOODBATH'],
	},

	FEINT: {
		id: 7549,
		name: 'Feint',
		icon: iconUrl(828),
		cooldown: 90000,
		statusesApplied: ['FEINT'],
	},

	TRUE_NORTH: {
		id: 7546,
		name: 'True North',
		icon: iconUrl(830),
		cooldown: 45000,
		charges: 2,
		statusesApplied: ['TRUE_NORTH'],
	},
})
