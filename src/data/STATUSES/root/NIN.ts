import {ensureStatuses} from '../type'
import {SHARED} from './SHARED'

export const NIN = ensureStatuses({
	TRICK_ATTACK_VULNERABILITY_UP: {
		id: 638,
		name: 'Vulnerability Up',
		icon: 'https://xivapi.com/i/015000/015020.png',
		duration: 15000,
	},
	
	TRICK_ATTACK: {
		id: 3254,
		name: 'Trick Attack',
		icon: 'https://xivapi.com/i/012000/012918.png',
		duration: 15000,
	},

	MUG_VULNERABILITY_UP: {
		id: 638, // Same ID as the old Trick vuln debuff, but this one is 5 seconds longer
		name: 'Vulnerability Up',
		icon: 'https://xivapi.com/i/015000/015020.png',
		duration: 20000,
	},

	KASSATSU: {
		id: 497,
		name: 'Kassatsu',
		icon: 'https://xivapi.com/i/012000/012902.png',
		duration: 15000,
	},

	DOTON: {
		id: 501,
		name: 'Doton',
		icon: 'https://xivapi.com/i/012000/012904.png',
		duration: 24000,
	},

	SUITON: {
		id: 507,
		name: 'Suiton',
		icon: 'https://xivapi.com/i/012000/012906.png',
		duration: 20000,
	},

	TEN_CHI_JIN: {
		id: 1186,
		name: 'Ten Chi Jin',
		icon: 'https://xivapi.com/i/012000/012911.png',
		duration: 6000,
	},

	BUNSHIN: {
		id: 1954,
		name: 'Bunshin',
		icon: 'https://xivapi.com/i/012000/012912.png',
		duration: 30000,
	},

	SHADE_SHIFT: {
		id: 488,
		name: 'Shade Shift',
		icon: 'https://xivapi.com/i/010000/010605.png',
		duration: 20000,
	},

	MEISUI: {
		id: 2689,
		name: 'Meisui',
		icon: 'https://xivapi.com/i/012000/012914.png',
		duration: 30000,
	},

	RAIJU_READY: {
		id: 2690,
		name: 'Raiju Ready',
		icon: 'https://xivapi.com/i/017000/017597.png',
		duration: 30000,
	},

	PHANTOM_KAMAITACHI_READY: {
		id: 2723,
		name: 'Meisui',
		icon: 'https://xivapi.com/i/012000/012917.png',
		duration: 45000,
	},
})
