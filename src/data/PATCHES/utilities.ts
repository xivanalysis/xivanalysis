import _ from 'lodash'
import {Report} from 'report'
import {GameEdition} from '../EDITIONS'
import {FALLBACK_KEY, LEVEL_CAP, PATCHES, PatchInfo, PatchNumber} from './patches'
import {JobKey} from "../JOBS"

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

export function contentSupported(loggedLevel: number | undefined, job: JobKey) {
	if (!loggedLevel) {
		// If the log doesn't include a level, assume it's supported to preserve the status quo.
		return true
	}

	if (job === "BLUE_MAGE") {
		// The level cap is only relevant for non-limited jobs like BLU. If and when they eventually add more (looking at you, BST), we'll need to update this.
		return true
	}

	return loggedLevel === LEVEL_CAP
}
