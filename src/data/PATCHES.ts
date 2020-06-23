import {ReportLanguage} from 'fflogs'
import _ from 'lodash'
import {Report} from 'report'

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

		// Fallback case for when fflogs borks
		// TODO: This probably will crop up in other places. Look into solving it higher up the chain.
		case ReportLanguage.UNKNOWN:
		case undefined:
			return GameEdition.GLOBAL
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
	'5.0': {
		date: {
			[GameEdition.GLOBAL]: 1561712400, // 28/06/19 09:00:00 GMT
			[GameEdition.CHINESE]: 1571126400, // 15/10/19 08:00:00 GMT
		},
	},
	'5.01': {
		date: {
			[GameEdition.GLOBAL]: 1563267600, // 16/07/19 09:00:00 GMT
		},
	},
	'5.05': {
		date: {
			[GameEdition.GLOBAL]: 1564477200, // 30/07/19 09:00:00 GMT
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
		},
	},
	'5.2': {
		date: {
			[GameEdition.GLOBAL]: 1582016400, // 08/02/20 09:00:00 GMT
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

export const getReportPatch = (report: Report) =>
	patchData[getPatch(report.edition, report.timestamp / 1000)]

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
