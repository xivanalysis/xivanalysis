import {ReportLanguage} from 'fflogs'
import _ from 'lodash'

export enum GameEdition {
	GLOBAL,
	KOREAN,
	CHINESE,
}

export function languageToEdition(lang: ReportLanguage): GameEdition {
	switch (lang) {
		case ReportLanguage.JAPANESE:
		case ReportLanguage.ENGLISH:
		case ReportLanguage.GERMAN:
		case ReportLanguage.FRENCH:
			return GameEdition.GLOBAL

		case ReportLanguage.KOREAN:
			return GameEdition.KOREAN

		case ReportLanguage.CHINESE:
			return GameEdition.CHINESE
	}

	throw new Error(`Unknown report language "${lang}" received.`)
}

// Using global as a source of truth on the order of patch keys
type PatchDates =
	& Partial<Record<GameEdition, number>>
	& {[GameEdition.GLOBAL]: number}

interface PatchBranch {
	baseUrl: string
}

export interface Patch {
	date: PatchDates
	branch?: PatchBranch
}

// This is all right from /PatchList - should be easy to sync Eventually™
const FALLBACK_KEY = '✖'
const PATCHES = {
	// Not going to support pre-4.0 at all
	[FALLBACK_KEY]: {
		date: {
			[GameEdition.GLOBAL]: 0,
			[GameEdition.KOREAN]: 0,
			[GameEdition.CHINESE]: 0,
		},
	},
	'4.0': {
		date: {
			[GameEdition.GLOBAL]: 1497517200,
			[GameEdition.KOREAN]: 1513670400,
			[GameEdition.CHINESE]: 1506412800,
		},
	},
	'4.01': {
		date: {
			[GameEdition.GLOBAL]: 1499162101,
			[GameEdition.KOREAN]: 1515484800,
			[GameEdition.CHINESE]: 1508832000,
		},
	},
	'4.05': {
		date: {
			[GameEdition.GLOBAL]: 1500368961,
			[GameEdition.KOREAN]: 1517299200,
			[GameEdition.CHINESE]: 1511251200,
		},
	},
	'4.06': {
		date: {
			[GameEdition.GLOBAL]: 1501747200,
			[GameEdition.KOREAN]: 1519113600,
			[GameEdition.CHINESE]: 1511251200,
		},
	},
	'4.1': {
		date: {
			[GameEdition.GLOBAL]: 1507622400,
			[GameEdition.KOREAN]: 1522137600,
			[GameEdition.CHINESE]: 1516694400,
		},
	},
	'4.11': {
		date: {
			[GameEdition.GLOBAL]: 1508839200,
			[GameEdition.KOREAN]: 1523952000,
			[GameEdition.CHINESE]: 1518508800,
		},
	},
	'4.15': {
		date: {
			[GameEdition.GLOBAL]: 1511258400,
			[GameEdition.KOREAN]: 1526976000,
			[GameEdition.CHINESE]: 1520841600,
		},
	},
	'4.2': {
		date: {
			[GameEdition.GLOBAL]: 1517227200,
			[GameEdition.KOREAN]: 1531209600,
			[GameEdition.CHINESE]: 1526371200,
		},
	},
	'4.25': {
		date: {
			[GameEdition.GLOBAL]: 1520935200,
			[GameEdition.KOREAN]: 1537257600,
			[GameEdition.CHINESE]: 1531814400,
		},
	},
	'4.3': {
		date: {
			[GameEdition.GLOBAL]: 1526976000,
			[GameEdition.KOREAN]: 1540886400,
			[GameEdition.CHINESE]: 1536048000,
		},
	},
	'4.31': {
		date: {
			[GameEdition.GLOBAL]: 1528223134,
			[GameEdition.KOREAN]: 1542700800,
			[GameEdition.CHINESE]: 1537862400,
		},
	},
	'4.35': {
		date: {
			[GameEdition.GLOBAL]: 1530617875,
			[GameEdition.KOREAN]: 1545120000,
			[GameEdition.CHINESE]: 1540886400,
		},
	},
	'4.36': {
		date: {
			[GameEdition.GLOBAL]: 1533635005,
			[GameEdition.KOREAN]: 1548144000,
			[GameEdition.CHINESE]: 1543910400,
		},
	},
	'4.4': {
		date: {
			[GameEdition.GLOBAL]: 1537268400,
			[GameEdition.KOREAN]: 1551168000,
			[GameEdition.CHINESE]: 1547539200,
		},
	},
	'4.5': {
		date: {
			[GameEdition.GLOBAL]: 1546857979,
			[GameEdition.KOREAN]: 1560844800,
			[GameEdition.CHINESE]: 1559030400,
		},
	},
	'Shadowbringers': {
		date: {
			[GameEdition.GLOBAL]: 1561712400, // 28/06/19 09:00:00 GMT
			[GameEdition.KOREAN]: 1575360000, // 03/12/19 08:00:00 GMT
			[GameEdition.CHINESE]: 1571126400, // 15/10/19 08:00:00 GMT
		},
		branch: {
			baseUrl: 'https://xivanalysis.com',
		},
	},
}

export type PatchNumber = keyof typeof PATCHES
export default PATCHES as Record<PatchNumber, Patch>

interface PatchData {[key: string]: Patch}
const patchData: PatchData = PATCHES

// This is intentionally in newest->oldest order
const sortedPatches = (Object.keys(patchData) as PatchNumber[]).sort(
	(a, b) => patchData[b].date[GameEdition.GLOBAL] - patchData[a].date[GameEdition.GLOBAL],
)

export function getPatch(edition: GameEdition, timestamp: number): PatchNumber {
	const key = sortedPatches.find(key => (patchData[key].date[edition] || Infinity) < timestamp)
	return key || FALLBACK_KEY
}

export function getPatchDate(edition: GameEdition, patch: PatchNumber) {
	let date: number | undefined
	for (const key of sortedPatches) {
		const editionDate = patchData[key].date[edition]
		if (editionDate) { date = editionDate }
		if (key === patch) { break }
	}
	return date || Infinity
}

export function patchSupported(
	edition: GameEdition,
	from: PatchNumber,
	to: PatchNumber,
	at = (new Date()).getTime(),
) {
	if (!from) { return false }

	const nextPatchKey = sortedPatches[sortedPatches.indexOf(to) - 1]
	const nextPatch = patchData[nextPatchKey]

	const fromDate = getPatchDate(edition, from)
	const toDate = nextPatch
		? getPatchDate(edition, nextPatchKey)
		: Infinity

	return _.inRange(at, fromDate, toDate)
}
