import {ActionRoot} from 'data/ACTIONS/root'
import {StatusRoot} from 'data/STATUSES/root'

// Fists
export const FISTLESS = 0

export const FISTS: Array<keyof StatusRoot> = [
	'FISTS_OF_EARTH',
	'FISTS_OF_FIRE',
	'FISTS_OF_WIND',
]

export const FORM_TIMEOUT_MILLIS = 15000

// Forms
export const FORMS: Array<keyof StatusRoot> = [
	'OPO_OPO_FORM',
	'RAPTOR_FORM',
	'COEURL_FORM',
]

export const OPO_OPO_SKILLS: Array<keyof ActionRoot> = [
	'BOOTSHINE',
	'DRAGON_KICK',
	'ARM_OF_THE_DESTROYER',
]

export const RAPTOR_SKILLS: Array<keyof ActionRoot> = [
	'TRUE_STRIKE',
	'TWIN_SNAKES',
	'FOUR_POINT_FURY',
]

export const COEURL_SKILLS: Array<keyof ActionRoot> = [
	'SNAP_PUNCH',
	'DEMOLISH',
	'ROCKBREAKER',
]
