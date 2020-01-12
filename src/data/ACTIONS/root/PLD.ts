import {ensureActions} from '../type'

export const PLD = ensureActions({
	// -----
	// Player GCDs
	// -----
	FAST_BLADE: {
		id: 9,
		name: 'Fast Blade',
		icon: 'https://xivapi.com/i/000000/000158.png',
		onGcd: true,
		potency: 200,
		combo: {
			start: true,
		},
	},
	RIOT_BLADE: {
		id: 15,
		name: 'Riot Blade',
		icon: 'https://xivapi.com/i/000000/000156.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 9,
			potency: 300,
		},
	},
	SHIELD_LOB: {
		id: 24,
		name: 'Shield Lob',
		icon: 'https://xivapi.com/i/000000/000164.png',
		onGcd: true,
		breaksCombo: true,
		potency: 120,
	},
	SHIELD_BASH: {
		id: 16,
		name: 'Shield Bash',
		icon: 'https://xivapi.com/i/000000/000154.png',
		onGcd: true,
		breaksCombo: true,
		potency: 110,
	},
	RAGE_OF_HALONE: {
		id: 21,
		name: 'Rage Of Halone',
		icon: 'https://xivapi.com/i/000000/000155.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 15,
			potency: 350,
			end: true,
		},
	},
	TOTAL_ECLIPSE: {
		id: 7381,
		name: 'Total Eclipse',
		icon: 'https://xivapi.com/i/002000/002511.png',
		onGcd: true,
		breaksCombo: true,
		potency: 110,
	},
	PROMINENCE: {
		id: 16457,
		name: 'Prominence',
		icon: 'https://xivapi.com/i/002000/002516.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 7381,
			potency: 220,
			end: true,
		},
	},
	GORING_BLADE: {
		id: 3538,
		name: 'Goring Blade',
		icon: 'https://xivapi.com/i/002000/002506.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 15,
			potency: 390,
			end: true,
		},
		statusesApplied: ['GORING_BLADE'],
	},
	CLEMENCY: {
		id: 3541,
		name: 'Clemency',
		icon: 'https://xivapi.com/i/002000/002509.png',
		onGcd: true,
		castTime: 1.5,
		breaksCombo: true,
	},
	ROYAL_AUTHORITY: {
		id: 3539,
		name: 'Royal Authority',
		icon: 'https://xivapi.com/i/002000/002507.png',
		onGcd: true,
		potency: 100,
		combo: {
			from: 15,
			potency: 550,
			end: true,
		},
		statusesApplied: ['SWORD_OATH'],
	},
	HOLY_SPIRIT: {
		id: 7384,
		name: 'Holy Spirit',
		icon: 'https://xivapi.com/i/002000/002514.png',
		onGcd: true,
		castTime: 1.5,
		breaksCombo: true,
		potency: 350,
	},
	HOLY_CIRCLE: {
		id: 16458,
		name: 'Holy Circle',
		icon: 'https://xivapi.com/i/002000/002517.png',
		onGcd: true,
		castTime: 1.5,
		breaksCombo: true,
		potency: 250,
	},
	ATONEMENT: {
		id: 16460,
		name: 'Atonement',
		icon: 'https://xivapi.com/i/002000/002519.png',
		onGcd: true,
		breaksCombo: true,
		potency: 550,
	},
	CONFITEOR: {
		id: 16459,
		name: 'Confiteor',
		icon: 'https://xivapi.com/i/002000/002518.png',
		onGcd: true,
		breaksCombo: true,
		potency: 800,
	},

	// -----
	// Player oGCDs
	// -----
	FIGHT_OR_FLIGHT: {
		id: 20,
		name: 'Fight Or Flight',
		icon: 'https://xivapi.com/i/000000/000166.png',
		onGcd: false,
		cooldown: 60,
		statusesApplied: ['FIGHT_OR_FLIGHT'],
	},
	IRON_WILL: {
		id: 28,
		name: 'Iron Will',
		icon: 'https://xivapi.com/i/002000/002505.png',
		onGcd: false,
		cooldown: 10,
	},
	SENTINEL: {
		id: 17,
		name: 'Sentinel',
		icon: 'https://xivapi.com/i/000000/000151.png',
		onGcd: false,
		cooldown: 180,
		statusesApplied: ['SENTINEL'],
	},
	CIRCLE_OF_SCORN: {
		id: 23,
		name: 'Circle Of Scorn',
		icon: 'https://xivapi.com/i/000000/000161.png',
		onGcd: false,
		cooldown: 25,
		statusesApplied: ['CIRCLE_OF_SCORN'],
	},
	COVER: {
		id: 27,
		name: 'Cover',
		icon: 'https://xivapi.com/i/002000/002501.png',
		onGcd: false,
		cooldown: 120,
		statusesApplied: ['COVER', 'COVERED'],
	},
	SPIRITS_WITHIN: {
		id: 29,
		name: 'Spirits Within',
		icon: 'https://xivapi.com/i/002000/002503.png',
		onGcd: false,
		cooldown: 30,
	},
	HALLOWED_GROUND: {
		id: 30,
		name: 'Hallowed Ground',
		icon: 'https://xivapi.com/i/002000/002502.png',
		onGcd: false,
		cooldown: 420,
		statusesApplied: ['HALLOWED_GROUND'],
	},
	SHELTRON: {
		id: 3542,
		name: 'Sheltron',
		icon: 'https://xivapi.com/i/002000/002510.png',
		onGcd: false,
		cooldown: 5,
		statusesApplied: ['SHELTRON'],
	},
	DIVINE_VEIL: {
		id: 3540,
		name: 'Divine Veil',
		icon: 'https://xivapi.com/i/002000/002508.png',
		onGcd: false,
		cooldown: 120,
		statusesApplied: ['DIVINE_VEIL', 'DIVINE_VEIL_PROC'],
	},
	INTERVENTION: {
		id: 7382,
		name: 'Intervention',
		icon: 'https://xivapi.com/i/002000/002512.png',
		onGcd: false,
		cooldown: 10,
		statusesApplied: ['INTERVENTION'],
	},
	REQUIESCAT: {
		id: 7383,
		name: 'Requiescat',
		icon: 'https://xivapi.com/i/002000/002513.png',
		onGcd: false,
		cooldown: 60,
		statusesApplied: ['REQUIESCAT'],
	},
	PASSAGE_OF_ARMS: {
		id: 7385,
		name: 'Passage Of Arms',
		icon: 'https://xivapi.com/i/002000/002515.png',
		onGcd: false,
		cooldown: 120,
		statusesApplied: ['PASSAGE_OF_ARMS'],
	},
	INTERVENE: {
		id: 16461,
		name: 'Intervene',
		icon: 'https://xivapi.com/i/002000/002520.png',
		onGcd: false,
		cooldown: 30,
		charges: 2,
	},
})
