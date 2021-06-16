import ACTIONS from 'data/ACTIONS'

export const FIRE_SPELLS: number[] = [
	ACTIONS.FIRE_I.id,
	ACTIONS.FIRE_II.id,
	ACTIONS.FIRE_III.id,
	ACTIONS.FIRE_IV.id,
	ACTIONS.FLARE.id,
	ACTIONS.DESPAIR.id,
]

/** Defining these lists separately since Gauge will need to treat the spells that must do damage to affect gauge differently from Umbral Soul */
export const ICE_SPELLS_UNTARGETED: number[] = [
	ACTIONS.UMBRAL_SOUL.id,
]
export const ICE_SPELLS_TARGETED: number[] = [
	ACTIONS.BLIZZARD_I.id,
	ACTIONS.BLIZZARD_II.id,
	ACTIONS.BLIZZARD_III.id,
	ACTIONS.BLIZZARD_IV.id,
	ACTIONS.FREEZE.id,

]
export const ICE_SPELLS: number[] = [
	...ICE_SPELLS_UNTARGETED,
	...ICE_SPELLS_TARGETED,
]

