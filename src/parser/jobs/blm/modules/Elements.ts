import {ActionKey} from 'data/ACTIONS'

export const FIRE_SPELLS: ActionKey[] = [
	'FIRE_I',
	'FIRE_II',
	'FIRE_III',
	'FIRE_IV',
	'FLARE',
	'DESPAIR',
	'HIGH_FIRE_II',
	'FLARE_STAR',
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
	'HIGH_BLIZZARD_II',
]
export const ICE_SPELLS: ActionKey[] = [
	...ICE_SPELLS_UNTARGETED,
	...ICE_SPELLS_TARGETED,
]

export const THUNDER_SPELLS: ActionKey[] = [
	'THUNDER_III',
	'THUNDER_IV',
	'HIGH_THUNDER',
	'HIGH_THUNDER_II',
]
