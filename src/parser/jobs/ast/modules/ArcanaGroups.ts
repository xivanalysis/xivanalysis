import {ActionRoot} from 'data/ACTIONS/root'
import {StatusRoot} from 'data/STATUSES/root'
// Grouped cards for future convenience - whatever processing desired

/* Grouped actions */

export const PLAY_I: Array<keyof ActionRoot> = [
	'THE_BALANCE',
	'THE_SPEAR',
]

export const PLAY_II_III: Array<keyof ActionRoot> = [
	'THE_BOLE',
	'THE_ARROW',
	'THE_EWER',
	'THE_SPIRE',
]

export const MINOR_ARCANA: Array<keyof ActionRoot> = [
	'LORD_OF_CROWNS',
	'LADY_OF_CROWNS',
]

export const OFFENSIVE_ARCANA_ACTION: Array<keyof ActionRoot> = [
	'THE_BALANCE',
	'THE_SPEAR',
]

export const DEFENSIVE_ARCANA_ACTION: Array<keyof ActionRoot> = [
	'THE_ARROW',
	'THE_BOLE',
	'THE_EWER',
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
]

export const DRAWN_CROWN_ARCANA: Array<keyof StatusRoot> = [
	'LORD_OF_CROWNS_DRAWN',
	'LADY_OF_CROWNS_DRAWN',
]

export const OFFENSIVE_ARCANA_STATUS: Array<keyof StatusRoot> = [
	'THE_BALANCE',
	'THE_SPEAR',
]

export const DEFENSIVE_ARCANA_STATUS: Array<keyof StatusRoot> = [
	'THE_ARROW',
	'THE_BOLE',
	'THE_EWER',
	'THE_SPIRE',
]
