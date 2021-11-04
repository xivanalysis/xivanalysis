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
const patchData = {
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
	'5.0': {
		date: {
			[GameEdition.GLOBAL]: 1561712400, // 28/06/19 09:00:00 GMT
			[GameEdition.CHINESE]: 1571126400, // 15/10/19 08:00:00 GMT
		},
	},
	'5.01': {
		date: {
			[GameEdition.GLOBAL]: 1563267600, // 16/07/19 09:00:00 GMT
			[GameEdition.CHINESE]: 1574150400, // 19/11/19 08:00:00 GMT
		},
	},
	'5.05': {
		date: {
			[GameEdition.GLOBAL]: 1564477200, // 30/07/19 09:00:00 GMT
			[GameEdition.CHINESE]: 1577174400, // 24/12/19 08:00:00 GMT
		},
	},
	'5.08': {
		date: {
			[GameEdition.GLOBAL]: 1567069200, // 29/08/19 09:00:00 GMT
			[GameEdition.KOREAN]: 1575360000, // 03/12/19 08:00:00 GMT
		},
	},
	'5.1': {
		date: {
			[GameEdition.GLOBAL]: 1572339600, // 29/10/19 09:00:00 GMT
			[GameEdition.KOREAN]: 1585036800, // 24/03/20 08:00:00 GMT
			[GameEdition.CHINESE]: 1580803200, // 04/02/20 08:00:00 GMT
		},
	},
	'5.2': {
		date: {
			[GameEdition.GLOBAL]: 1582016400, // 08/02/20 09:00:00 GMT
			[GameEdition.KOREAN]: 1598947200, // 01/09/20 08:00:00 GMT
			[GameEdition.CHINESE]: 1595318400, // 21/07/20 08:00:00 GMT
		},
	},
	'5.3': {
		date: {
			[GameEdition.GLOBAL]: 1597136400, // 11/08/20 09:00:00 GMT
			[GameEdition.KOREAN]: 1610438400, // 12/01/21 08:00:00 GMT
			[GameEdition.CHINESE]: 1606809600, // 01/12/20 08:00:00 GMT
		},
	},
	'5.4': {
		date: {
			[GameEdition.GLOBAL]: 1607418000, // 08/12/20 09:00:00 GMT
			[GameEdition.KOREAN]: 1621324800, // 18/05/21 08:00:00 GMT
			[GameEdition.CHINESE]: 1619078400, // 16/04/21 08:00:00 GMT
		},
	},
	'5.5': {
		date: {
			[GameEdition.GLOBAL]: 1618304400, // 13/04/21 09:00:00 GMT
			[GameEdition.KOREAN]: 1631606400, // 14/09/21 08:00:00 GMT
			[GameEdition.CHINESE]: 1628582400, // 10/08/21 08:00:00 GMT
		},
	},
	// Do not add new patches beneath this point.
	'Perpetuity - CORE ONLY': {
		date: {
			[GameEdition.GLOBAL]: Infinity,
			[GameEdition.KOREAN]: Infinity,
			[GameEdition.CHINESE]: Infinity,
		},
	},
}

export type PatchNumber = keyof typeof patchData
export const PATCHES = patchData as Record<PatchNumber, PatchInfo>
