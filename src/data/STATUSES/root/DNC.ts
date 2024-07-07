import {iconUrl} from 'data/icon'
import {ensureStatuses} from '../type'

export const DNC = ensureStatuses({
	SILKEN_SYMMETRY: {
		id: 2693,
		name: 'Silken Symmetry',
		icon: iconUrl(13718),
		duration: 30000,
	},
	SILKEN_FLOW: {
		id: 2694,
		name: 'Silken Flow',
		icon: iconUrl(13719),
		duration: 30000,
	},
	FLOURISHING_SYMMETRY: {
		id: 3017,
		name: 'Flourishing Symmetry',
		icon: iconUrl(13725),
		duration: 30000,
	},
	FLOURISHING_FLOW: {
		id: 3018,
		name: 'Flourishing Flow',
		icon: iconUrl(13726),
		duration: 30000,
	},
	THREEFOLD_FAN_DANCE: {
		id: 1820,
		name: 'Threefold Fan Dance',
		icon: iconUrl(13707),
		duration: 30000,
	},
	FOURFOLD_FAN_DANCE: {
		id: 2699,
		name: 'Fourfold Fan Dance',
		icon: 'https://xivapi.com/i/013000/013723.png',
		duration: 30000,
	},
	FINISHING_MOVE_READY: {
		id: 3868,
		name: 'Finishing Move Ready',
		icon: iconUrl(13727),
		duration: 30000,
	},
	FLOURISHING_STARFALL: {
		id: 2700,
		name: 'Flourishing Starfall',
		icon: iconUrl(13724),
		duration: 20000,
	},
	STANDARD_STEP: {
		id: 1818,
		name: 'Standard Step',
		icon: iconUrl(13705),
		duration: 15000,
	},
	TECHNICAL_STEP: {
		id: 1819,
		name: 'Technical Step',
		icon: iconUrl(13706),
		duration: 15000,
	},
	STANDARD_FINISH: {
		id: 1821,
		name: 'Standard Finish',
		icon: iconUrl(13708),
		duration: 60000,
	},
	LAST_DANCE_READY: {
		id: 3867,
		name: 'Last Dance Ready',
		icon: iconUrl(13728),
		duration: 30000,
	},
	TECHNICAL_FINISH: {
		id: 1822,
		name: 'Technical Finish',
		icon: iconUrl(13709),
		duration: 20000,
	},
	DANCE_OF_THE_DAWN_READY: {
		id: 3869,
		name: 'Dance of the Dawn Ready',
		icon: iconUrl(13729),
		duration: 30000,
	},
	FLOURISHING_FINISH: {
		id: 2698,
		name: 'Flourishing Finish',
		icon: iconUrl(13722),
		duration: 30000,
	},
	CLOSED_POSITION: {
		id: 1823,
		name: 'Closed Position',
		icon: iconUrl(13712),
	},
	DANCE_PARTNER: {
		id: 1824,
		name: 'Dance Partner',
		icon: iconUrl(13713),
	},
	DEVILMENT: {
		id: 1825,
		name: 'Devilment',
		icon: iconUrl(13714),
		duration: 20000,
	},
	SHIELD_SAMBA: {
		id: 1826,
		name: 'Shield Samba',
		icon: iconUrl(13715),
		duration: 15000,
	},
	IMPROVISATION: {
		id: 1827,
		name: 'Improvisation',
		icon: iconUrl(13716),
		duration: 15000,
	},
	RISING_RHYTHM: {
		id: 2696,
		name: 'Rising Rhythm',
		icon: iconUrl(17350),
		duration: 15000,
	},
	IMPROVISATION_REGEN: {
		id: 2695,
		name: 'Improvisation',
		icon: iconUrl(13720),
		duration: 15000,
	},
	IMPROVISED_FINISH: {
		id: 2697,
		name: 'Improvised Finish',
		icon: iconUrl(13721),
		duration: 30000,
	},
	ESPRIT: { // The Esprit buff sourced from Standard Finish, applies to the DNC and their Dance Partner
		id: 1847,
		name: 'Esprit',
		icon: iconUrl(13710),
		duration: 60000,
	},
	ESPRIT_TECHNICAL: { // The Esprit buff sourced from Technical finish. Superseded by ESPRIT
		id: 1848,
		name: 'Esprit',
		icon: iconUrl(13711),
		duration: 20000,
	},
	STANDARD_FINISH_PARTNER: { // The standard finish buff you get when you're the DNC's partner
		id: 2105,
		name: 'Standard Finish',
		icon: iconUrl(13708),
		duration: 60000,
	},
})
