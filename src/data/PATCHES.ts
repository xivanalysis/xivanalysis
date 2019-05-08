import {Fflogs} from '@xivanalysis/parser-reader-fflogs'
import _ from 'lodash'

export enum GameEdition {
	GLOBAL,
	KOREAN,
	CHINESE,
}

export function languageToEdition(lang: Fflogs.ReportLanguage): GameEdition {
	switch (lang) {
		case Fflogs.ReportLanguage.JAPANESE:
		case Fflogs.ReportLanguage.ENGLISH:
		case Fflogs.ReportLanguage.GERMAN:
		case Fflogs.ReportLanguage.FRENCH:
			return GameEdition.GLOBAL

		case Fflogs.ReportLanguage.KOREAN:
			return GameEdition.KOREAN

		case Fflogs.ReportLanguage.CHINESE:
			return GameEdition.CHINESE
	}

	throw new Error()
}

export interface Patch {
	// Using global as a source of truth on the order of patch keys
	// Dates should be specified as a unix epoc _in milliseconds_ (blame js)
	date: Partial<Record<GameEdition, number>> & {[GameEdition.GLOBAL]: number}
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
			[GameEdition.GLOBAL]: 1497517200000,
			[GameEdition.KOREAN]: 1513670400000,
			[GameEdition.CHINESE]: 1506412800000,
		},
	},
	'4.01': {
		date: {
			[GameEdition.GLOBAL]: 1499162101000,
			[GameEdition.KOREAN]: 1515484800000,
			[GameEdition.CHINESE]: 1508832000000,
		},
	},
	'4.05': {
		date: {
			[GameEdition.GLOBAL]: 1500368961000,
			[GameEdition.KOREAN]: 1517299200000,
			[GameEdition.CHINESE]: 1511251200000,
		},
	},
	'4.06': {
		date: {
			[GameEdition.GLOBAL]: 1501747200000,
			[GameEdition.KOREAN]: 1519113600000,
			[GameEdition.CHINESE]: 1511251200000,
		},
	},
	'4.1': {
		date: {
			[GameEdition.GLOBAL]: 1507622400000,
			[GameEdition.KOREAN]: 1522137600000,
			[GameEdition.CHINESE]: 1516694400000,
		},
	},
	'4.11': {
		date: {
			[GameEdition.GLOBAL]: 1508839200000,
			[GameEdition.KOREAN]: 1523952000000,
			[GameEdition.CHINESE]: 1518508800000,
		},
	},
	'4.15': {
		date: {
			[GameEdition.GLOBAL]: 1511258400000,
			[GameEdition.KOREAN]: 1526976000000,
			[GameEdition.CHINESE]: 1520841600000,
		},
	},
	'4.2': {
		date: {
			[GameEdition.GLOBAL]: 1517227200000,
			[GameEdition.KOREAN]: 1531209600000,
			[GameEdition.CHINESE]: 1526371200000,
		},
	},
	'4.25': {
		date: {
			[GameEdition.GLOBAL]: 1520935200000,
			[GameEdition.KOREAN]: 1537257600000,
			[GameEdition.CHINESE]: 1531814400000,
		},
	},
	'4.3': {
		date: {
			[GameEdition.GLOBAL]: 1526976000000,
			[GameEdition.KOREAN]: 1540886400000,
			[GameEdition.CHINESE]: 1536048000000,
		},
	},
	'4.31': {
		date: {
			[GameEdition.GLOBAL]: 1528223134000,
			[GameEdition.KOREAN]: 1542700800000,
			[GameEdition.CHINESE]: 1537862400000,
		},
	},
	'4.35': {
		date: {
			[GameEdition.GLOBAL]: 1530617875000,
			[GameEdition.KOREAN]: 1545120000000,
			[GameEdition.CHINESE]: 1540886400000,
		},
	},
	'4.36': {
		date: {
			[GameEdition.GLOBAL]: 1533635005000,
			[GameEdition.KOREAN]: 1548144000000,
			[GameEdition.CHINESE]: 1543910400000,
		},
	},
	'4.4': {
		date: {
			[GameEdition.GLOBAL]: 1537268400000,
			[GameEdition.KOREAN]: 1551168000000,
			[GameEdition.CHINESE]: 1547539200000,
		},
	},
	'4.5': {
		date: {
			[GameEdition.GLOBAL]: 1546857979000,
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
