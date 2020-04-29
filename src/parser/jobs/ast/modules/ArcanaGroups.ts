import {ActionRoot} from 'data/ACTIONS/root'
import {StatusRoot} from 'data/STATUSES/root'
// Grouped cards for future convenience - whatever processing desired

/* Grouped actions */

export const PLAY: Array<keyof ActionRoot> = [
	'THE_BALANCE',
	'THE_BOLE',
	'THE_ARROW',
	'THE_SPEAR',
	'THE_EWER',
	'THE_SPIRE',
	'LORD_OF_CROWNS',
	'LADY_OF_CROWNS',
]

export const SOLAR_SEAL_ARCANA: Array<keyof ActionRoot> = [
	'THE_BALANCE',
	'THE_BOLE',
]

export const LUNAR_SEAL_ARCANA: Array<keyof ActionRoot> = [
	'THE_ARROW',
	'THE_EWER',
]

export const CELESTIAL_SEAL_ARCANA: Array<keyof ActionRoot> = [
	'THE_SPEAR',
	'THE_SPIRE',
]

/* Arcana spread states */

export const DRAWN_ARCANA: Array<keyof StatusRoot> = [
	'BALANCE_DRAWN',
	'BOLE_DRAWN',
	'ARROW_DRAWN',
	'SPEAR_DRAWN',
	'EWER_DRAWN',
	'SPIRE_DRAWN',
	'LORD_OF_CROWNS_DRAWN',
	'LADY_OF_CROWNS_DRAWN',
]

export const ARCANA_STATUSES: Array<keyof StatusRoot> = [
	'THE_BALANCE',
	'THE_BOLE',
	'THE_ARROW',
	'THE_SPEAR',
	'THE_EWER',
	'THE_SPIRE',
	'LORD_OF_CROWNS',
	'LADY_OF_CROWNS',
]
