import {ensureRecord} from 'utilities'
import {GameEdition} from '../EDITIONS'

// Using global as a source of truth on the order of patch keys
type PatchDates =
	& Partial<Record<GameEdition, number>>
	& {[GameEdition.GLOBAL]: number}

interface PatchBranch {
	baseUrl: string
}

export interface PatchInfo {
	date: PatchDates
	branch?: PatchBranch
}

// This is all right from /PatchList - should be easy to sync Eventually™
export const FALLBACK_KEY = '✖'
export const PATCHES = ensureRecord<PatchInfo>()({
	// Not going to support pre-4.0 at all
	[FALLBACK_KEY]: {
		date: {
			[GameEdition.GLOBAL]: 0,
			[GameEdition.KOREAN]: 0,
			[GameEdition.CHINESE]: 0,
		},
	},
	'Stormblood': {
		date: {
			[GameEdition.GLOBAL]: 1497517200,
			[GameEdition.KOREAN]: 1513670400,
			[GameEdition.CHINESE]: 1506412800,
		},
		branch: {
			baseUrl: 'https://stormblood.xivanalysis.com',
		},
	},
	'Shadowbringers': {
		date: {
			[GameEdition.GLOBAL]: 1561712400, // 28/06/19 09:00:00 GMT
			[GameEdition.KOREAN]: 1575360000, // 03/12/19 08:00:00 GMT
			[GameEdition.CHINESE]: 1571126400, // 15/10/19 08:00:00 GMT
		},
		branch: {
			baseUrl: 'https://shadowbringers.xivanalysis.com',
		},
	},
	'6.0': {
		date: {
			[GameEdition.GLOBAL]: 1637312400, // 19/11/21 09:00:00 GMT
		},
	},
	'6.05': {
		date: {
			[GameEdition.GLOBAL]: 1641286800, // 04/01/22 09:00:00 GMT
		},
	},
	'6.08': {
		date: {
			[GameEdition.GLOBAL]: 1643101200, // 25/01/22 09:00:00 GMT
			[GameEdition.KOREAN]: 1652169600, // 10/05/22 08:00:00 GMT
		},
	},
})

export type PatchNumber = keyof typeof PATCHES
