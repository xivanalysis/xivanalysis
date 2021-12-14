import _ from 'lodash'
import {Report} from 'report'
import {GameEdition} from '../EDITIONS'
import {FALLBACK_KEY, PATCHES, PatchInfo, PatchNumber} from './patches'

interface PatchData {[key: string]: PatchInfo}
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
	at = (new Date()).getTime() / 1000,
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
