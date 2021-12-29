import {ActionKey} from 'data/ACTIONS'
import {StatusKey} from 'data/STATUSES'

// Forms
export const FORM_TIMEOUT_MILLIS = 30000

export const FORMS: StatusKey[] = [
	'OPO_OPO_FORM',
	'RAPTOR_FORM',
	'COEURL_FORM',
]

export const OPO_OPO_SKILLS: ActionKey[] = [
	'BOOTSHINE',
	'DRAGON_KICK',
	'SHADOW_OF_THE_DESTROYER',
]

export const RAPTOR_SKILLS: ActionKey[] = [
	'TRUE_STRIKE',
	'TWIN_SNAKES',
	'FOUR_POINT_FURY',
]

export const COEURL_SKILLS: ActionKey[] = [
	'SNAP_PUNCH',
	'DEMOLISH',
	'ROCKBREAKER',
]

export const FORM_SKILLS: ActionKey[] = [
	...OPO_OPO_SKILLS,
	...RAPTOR_SKILLS,
	...COEURL_SKILLS,
]

export const BLITZ_SKILLS: ActionKey[] = [
	'ELIXIR_FIELD',
	'CELESTIAL_REVOLUTION',
	'RISING_PHOENIX',
	'PHANTOM_RUSH',
]
