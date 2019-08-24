import ACTIONS from 'data/ACTIONS'

export default {

	FLOURISHING_CASCADE: {
		id: 1814,
		name: 'Flourishing Cascade',
		icon: 'https://xivapi.com/i/013000/013701.png',
		duration: 20,
		action: ACTIONS.FLOURISH,
	},
	FLOURISHING_FOUNTAIN: {
		id: 1815,
		name: 'Flourishing Fountain',
		icon: 'https://xivapi.com/i/013000/013702.png',
		duration: 20,
		// Do not associate with Flourish so that PrepullStatus does not duplicate synthetic cast events for Flourish pre-pull
	},
	FLOURISHING_WINDMILL: {
		id: 1816,
		name: 'Flourishing Windmill',
		icon: 'https://xivapi.com/i/013000/013703.png',
		duration: 20,
		// Do not associate with Flourish so that PrepullStatus does not duplicate synthetic cast events for Flourish pre-pull
	},
	FLOURISHING_SHOWER: {
		id: 1817,
		name: 'Flourishing Shower',
		icon: 'https://xivapi.com/i/013000/013704.png',
		duration: 20,
		// Do not associate with Flourish so that PrepullStatus does not duplicate synthetic cast events for Flourish pre-pull
	},
	STANDARD_STEP: {
		id: 1818,
		name: 'Standard Step',
		icon: 'https://xivapi.com/i/013000/013705.png',
		duration: 15,
		action: ACTIONS.STANDARD_STEP,
	},
	TECHNICAL_STEP: {
		id: 1819,
		name: 'Technical Step',
		icon: 'https://xivapi.com/i/013000/013706.png',
		duration: 15,
		action: ACTIONS.TECHNICAL_STEP,
	},
	FLOURISHING_FAN_DANCE: {
		id: 1820,
		name: 'Flourishing Fan Dance',
		icon: 'https://xivapi.com/i/013000/013707.png',
		duration: 20,
		// Do not associate with Flourish so that PrepullStatus does not duplicate synthetic cast events for Flourish pre-pull
	},
	STANDARD_FINISH: {
		id: 1821,
		name: 'Standard Finish',
		icon: 'https://xivapi.com/i/013000/013708.png',
		duration: 20,
	},
	TECHNICAL_FINISH: {
		id: 1822,
		name: 'Technical Finish',
		icon: 'https://xivapi.com/i/013000/013709.png',
		duration: 20,
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
		duration: 20,
		action: ACTIONS.DEVILMENT,
	},
	SHIELD_SAMBA: {
		id: 1826,
		name: 'Shield Samba',
		icon: 'https://xivapi.com/i/013000/013715.png',
		duration: 15,
		action: ACTIONS.SHIELD_SAMBA,
	},
	IMPROVISATION: {
		id: 1827,
		name: 'Improvisation',
		icon: 'https://xivapi.com/i/013000/013716.png',
		duration: 15,
		action: ACTIONS.IMPROVISATION,
	},
	ESPRIT: {
		id: 1847,
		name: 'Esprit',
		icon: 'https://xivapi.com/i/013000/013710.png',
		duration: 15,
	},
	STANDARD_FINISH_PARTNER: { // The standard finish buff you get when you're the DNC's partner
		id: 2105,
		name: 'Standard Finish',
		icon: 'https://xivapi.com/i/013000/013708.png',
		duration: 20,
	},
}
