import {ensureStatuses} from '../type'

export const DNC = ensureStatuses({
	// Silken Symmetry/Flow are the pre-6.1 combined proc statuses, so they get the Flourishing name in the base layer
	SILKEN_SYMMETRY: {
		id: 2693,
		name: 'Flourishing Symmetry',
		icon: 'https://xivapi.com/i/013000/013718.png',
		duration: 30000,
	},
	SILKEN_FLOW: {
		id: 2694,
		name: 'Flourishing Flow',
		icon: 'https://xivapi.com/i/013000/013719.png',
		duration: 30000,
	},
	FLOURISHING_SYMMETRY: {
		id: 3017,
		name: 'Flourishing Symmetry',
		icon: 'https://xivapi.com/i/013000/013725.png',
		duration: 30000,
	},
	FLOURISHING_FLOW: {
		id: 3018,
		name: 'Flourishing Flow',
		icon: 'https://xivapi.com/i/013000/013726.png',
		duration: 30000,
	},
	THREEFOLD_FAN_DANCE: {
		id: 1820,
		name: 'Threefold Fan Dance',
		icon: 'https://xivapi.com/i/013000/013707.png',
		duration: 30000,
	},
	FOURFOLD_FAN_DANCE: {
		id: 2699,
		name: 'Fourfold Fan Dance',
		icon: 'https://xivapi.com/i/013000/013723.png',
		duration: 30000,
	},
	FLOURISHING_STARFALL: {
		id: 2700,
		name: 'Flourishing Starfall',
		icon: 'https://xivapi.com/i/013000/013724.png',
		duration: 20000,
	},
	STANDARD_STEP: {
		id: 1818,
		name: 'Standard Step',
		icon: 'https://xivapi.com/i/013000/013705.png',
		duration: 15000,
	},
	TECHNICAL_STEP: {
		id: 1819,
		name: 'Technical Step',
		icon: 'https://xivapi.com/i/013000/013706.png',
		duration: 15000,
	},
	STANDARD_FINISH: {
		id: 1821,
		name: 'Standard Finish',
		icon: 'https://xivapi.com/i/013000/013708.png',
		duration: 60000,
	},
	TECHNICAL_FINISH: {
		id: 1822,
		name: 'Technical Finish',
		icon: 'https://xivapi.com/i/013000/013709.png',
		duration: 20000,
	},
	FLOURISHING_FINISH: {
		id: 2698,
		name: 'Flourishing Finish',
		icon: 'https://xivapi.com/i/013000/013722.png',
		duration: 30000,
	},
	CLOSED_POSITION: {
		id: 1823,
		name: 'Closed Position',
		icon: 'https://xivapi.com/i/013000/013712.png',
	},
	DANCE_PARTNER: {
		id: 1824,
		name: 'Dance Partner',
		icon: 'https://xivapi.com/i/013000/013713.png',
	},
	DEVILMENT: {
		id: 1825,
		name: 'Devilment',
		icon: 'https://xivapi.com/i/013000/013714.png',
		duration: 20000,
	},
	SHIELD_SAMBA: {
		id: 1826,
		name: 'Shield Samba',
		icon: 'https://xivapi.com/i/013000/013715.png',
		duration: 15000,
	},
	IMPROVISATION: {
		id: 1827,
		name: 'Improvisation',
		icon: 'https://xivapi.com/i/013000/013716.png',
		duration: 15000,
	},
	RISING_RHYTHM: {
		id: 2696,
		name: 'Rising Rhythm',
		icon: '	https://xivapi.com/i/017000/017350.png',
		duration: 15000,
	},
	IMPROVISATION_REGEN: {
		id: 2695,
		name: 'Improvisation',
		icon: 'https://xivapi.com/i/013000/013720.png',
		duration: 15000,
	},
	IMPROVISED_FINISH: {
		id: 2697,
		name: 'Improvised Finish',
		icon: 'https://xivapi.com/i/013000/013721.png',
		duration: 30000,
	},
	ESPRIT: { // The Esprit buff sourced from Standard Finish, applies to the DNC and their Dance Partner
		id: 1847,
		name: 'Esprit',
		icon: 'https://xivapi.com/i/013000/013710.png',
		duration: 60000,
	},
	ESPRIT_TECHNICAL: { // The Esprit buff sourced from Technical finish. Superseded by ESPRIT
		id: 1848,
		name: 'Esprit',
		icon: 'https://xivapi.com/i/013000/013711.png',
		duration: 20000,
	},
	STANDARD_FINISH_PARTNER: { // The standard finish buff you get when you're the DNC's partner
		id: 2105,
		name: 'Standard Finish',
		icon: 'https://xivapi.com/i/013000/013708.png',
		duration: 60000,
	},
})
