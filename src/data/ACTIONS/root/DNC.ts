import STATUSES from 'data/STATUSES'
import {ensureActions} from '../type'

export const DNC = ensureActions({
	SINGLE_STANDARD_FINISH: {
		id: 16191,
		icon: 'https://xivapi.com/i/003000/003459.png',
		name: 'Single Standard Finish',
		onGcd: true,
		cooldown: 1.5,
	},
	DOUBLE_STANDARD_FINISH: {
		id: 16192,
		icon: 'https://xivapi.com/i/003000/003459.png',
		name: 'Double Standard Finish',
		onGcd: true,
		cooldown: 1.5,
	},
	SINGLE_TECHNICAL_FINISH: {
		id: 16193,
		icon: 'https://xivapi.com/i/003000/003474.png',
		name: 'Single Technical Finish',
		onGcd: true,
		cooldown: 1.5,
	},
	DOUBLE_TECHNICAL_FINISH: {
		id: 16194,
		icon: 'https://xivapi.com/i/003000/003474.png',
		name: 'Double Technical Finish',
		onGcd: true,
		cooldown: 1.5,
	},
	TRIPLE_TECHNICAL_FINISH: {
		id: 16195,
		icon: 'https://xivapi.com/i/003000/003474.png',
		name: 'Triple Technical Finish',
		onGcd: true,
		cooldown: 1.5,
	},
	QUADRUPLE_TECHNICAL_FINISH: {
		id: 16196,
		icon: 'https://xivapi.com/i/003000/003474.png',
		name: 'Quadruple Technical Finish',
		onGcd: true,
		cooldown: 1.5,
	},
	CASCADE: {
		id: 15989,
		icon: 'https://xivapi.com/i/003000/003451.png',
		name: 'Cascade',
		onGcd: true,
		combo: {
			start: true,
		},
	},
	FOUNTAIN: {
		id: 15990,
		icon: 'https://xivapi.com/i/003000/003452.png',
		name: 'Fountain',
		onGcd: true,
		combo: {
			from: 15989,
			end: true,
		},
	},
	REVERSE_CASCADE: {
		id: 15991,
		icon: 'https://xivapi.com/i/003000/003460.png',
		name: 'Reverse Cascade',
		onGcd: true,
	},
	FOUNTAINFALL: {
		id: 15992,
		icon: 'https://xivapi.com/i/003000/003464.png',
		name: 'Fountainfall',
		onGcd: true,
	},
	WINDMILL: {
		id: 15993,
		icon: 'https://xivapi.com/i/003000/003453.png',
		name: 'Windmill',
		onGcd: true,
		combo: {
			start: true,
		},
	},
	BLADESHOWER: {
		id: 15994,
		icon: 'https://xivapi.com/i/003000/003461.png',
		name: 'Bladeshower',
		onGcd: true,
		combo: {
			from: 15993,
			end: true,
		},
	},
	RISING_WINDMILL: {
		id: 15995,
		icon: 'https://xivapi.com/i/003000/003463.png',
		name: 'Rising Windmill',
		onGcd: true,
	},
	BLOODSHOWER: {
		id: 15996,
		icon: 'https://xivapi.com/i/003000/003465.png',
		name: 'Bloodshower',
		onGcd: true,
	},
	STANDARD_STEP: {
		id: 15997,
		icon: 'https://xivapi.com/i/003000/003454.png',
		name: 'Standard Step',
		onGcd: true,
		cooldown: 30,
		gcdRecast: 1.5,
		statusesApplied: [STATUSES.STANDARD_STEP],
	},
	TECHNICAL_STEP: {
		id: 15998,
		icon: 'https://xivapi.com/i/003000/003473.png',
		name: 'Technical Step',
		onGcd: true,
		cooldown: 120,
		gcdRecast: 1.5,
		statusesApplied: [STATUSES.TECHNICAL_STEP],
	},
	EMBOITE: {
		id: 15999,
		icon: 'https://xivapi.com/i/003000/003455.png',
		name: 'Emboite',
		onGcd: true,
		cooldown: 1,
	},
	ENTRECHAT: {
		id: 16000,
		icon: 'https://xivapi.com/i/003000/003456.png',
		name: 'Entrechat',
		onGcd: true,
		cooldown: 1,
	},
	JETE: {
		id: 16001,
		icon: 'https://xivapi.com/i/003000/003457.png',
		name: 'Jete',
		onGcd: true,
		cooldown: 1,
	},
	PIROUETTE: {
		id: 16002,
		icon: 'https://xivapi.com/i/003000/003458.png',
		name: 'Pirouette',
		onGcd: true,
		cooldown: 1,
	},
	STANDARD_FINISH: {
		id: 16003,
		icon: 'https://xivapi.com/i/003000/003459.png',
		name: 'Standard Finish',
		onGcd: true,
		cooldown: 1.5,
	},
	TECHNICAL_FINISH: {
		id: 16004,
		icon: 'https://xivapi.com/i/003000/003474.png',
		name: 'Technical Finish',
		onGcd: true,
		cooldown: 1.5,
	},
	SABER_DANCE: {
		id: 16005,
		icon: 'https://xivapi.com/i/003000/003476.png',
		name: 'Saber Dance',
		onGcd: true,
	},
	CLOSED_POSITION: {
		id: 16006,
		icon: 'https://xivapi.com/i/003000/003470.png',
		name: 'Closed Position',
		onGcd: false,
		cooldown: 30,
	},
	FAN_DANCE: {
		id: 16007,
		icon: 'https://xivapi.com/i/003000/003462.png',
		name: 'Fan Dance',
		onGcd: false,
		cooldown: 1,
	},
	FAN_DANCE_II: {
		id: 16008,
		icon: 'https://xivapi.com/i/003000/003466.png',
		name: 'Fan Dance II',
		onGcd: false,
		cooldown: 1,
	},
	FAN_DANCE_III: {
		id: 16009,
		icon: 'https://xivapi.com/i/003000/003472.png',
		name: 'Fan Dance III',
		onGcd: false,
		cooldown: 1,
	},
	EN_AVANT: {
		id: 16010,
		icon: 'https://xivapi.com/i/003000/003467.png',
		name: 'En Avant',
		onGcd: false,
		cooldown: 30,
	},
	DEVILMENT: {
		id: 16011,
		icon: 'https://xivapi.com/i/003000/003471.png',
		name: 'Devilment',
		onGcd: false,
		cooldown: 120,
		statusesApplied: [STATUSES.DEVILMENT],
	},
	SHIELD_SAMBA: {
		id: 16012,
		icon: 'https://xivapi.com/i/003000/003469.png',
		name: 'Shield Samba',
		onGcd: false,
		cooldown: 180,
		statusesApplied: [STATUSES.SHIELD_SAMBA],
	},
	FLOURISH: {
		id: 16013,
		icon: 'https://xivapi.com/i/003000/003475.png',
		name: 'Flourish',
		onGcd: false,
		cooldown: 60,
		statusesApplied: [STATUSES.FLOURISHING_CASCADE, STATUSES.FLOURISHING_FOUNTAIN, STATUSES.FLOURISHING_WINDMILL, STATUSES.FLOURISHING_SHOWER, STATUSES.FLOURISHING_FAN_DANCE],
	},
	IMPROVISATION: {
		id: 16014,
		icon: 'https://xivapi.com/i/003000/003477.png',
		name: 'Improvisation',
		onGcd: false,
		cooldown: 120,
		statusesApplied: [STATUSES.IMPROVISATION, STATUSES.IMPROVISATION_HEALING],
	},
	CURING_WALTZ: {
		id: 16015,
		icon: 'https://xivapi.com/i/003000/003468.png',
		name: 'Curing Waltz',
		onGcd: false,
		cooldown: 60,
	},
	ENDING: {
		id: 18073,
		icon: 'https://xivapi.com/i/003000/003478.png',
		name: 'Ending',
		onGcd: false,
		cooldown: 1,
	},
})
