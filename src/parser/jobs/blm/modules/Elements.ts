import {ActionKey} from 'data/ACTIONS'

export const FIRE_SPELLS: ActionKey[] = [
	'FIRE_I',
	'FIRE_II',
	'FIRE_III',
	'FIRE_IV',
	'FLARE',
	'DESPAIR',
]

/** Defining these lists separately since Gauge will need to treat the spells that must do damage to affect gauge differently from Umbral Soul */
export const ICE_SPELLS_UNTARGETED: ActionKey[] = [
	'UMBRAL_SOUL',
]
export const ICE_SPELLS_TARGETED: ActionKey[] = [
	'BLIZZARD_I',
	'BLIZZARD_II',
	'BLIZZARD_III',
	'BLIZZARD_IV',
	'FREEZE',

]
export const ICE_SPELLS: ActionKey[] = [
	...ICE_SPELLS_UNTARGETED,
	...ICE_SPELLS_TARGETED,
]

