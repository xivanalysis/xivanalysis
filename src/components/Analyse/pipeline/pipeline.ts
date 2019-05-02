import {readFflogs} from '@xivanalysis/parser-reader-fflogs'
import {getFflogsEvents} from 'api'
import * as Errors from 'errors'
import * as Fflogs from 'fflogs'
import {Report} from 'store/report'
import {findActiveTargets} from './findActiveTargets'
import {getAdditionalEventsQuery} from './getAdditionalEventsQuery'
import {mergeEvents} from './mergeEvents'

/**
 * TODO:
 * This represents the pipeline and handling for fflogs specifically.
 * Down the track, it'd be good to generalise the `Analyse` page, and
 * pull the below apart into per-source pipelines that power it.
 */

// TODO: this should be the fflogs-specific handling that's currently in
// Conductor. Analyse can use it to prep the analyser.

interface PipelineOptions {
	report: Report,
	fight?: Fflogs.Fight,
	combatant?: Fflogs.Actor,
}

export async function fflogsPipeline({report, fight, combatant}: PipelineOptions) {
	// --- Sanity check ----
	// Fight exists
	if (!fight) {
		throw new Errors.NotFoundError({type: 'fight'})
	}

	// Combatant exists
	if (!combatant) {
		throw new Errors.NotFoundError({type: 'friendly combatant'})
	}

	// Combatant took part in fight
	if (!combatant.fights.find(f => f.id === fight.id)) {
		throw new Errors.DidNotParticipateError({
			combatant: combatant.name,
			fight: fight.id,
		})
	}

	// --- Retrieve events ---
	const logEvents = await getFflogsEvents(
		report.code,
		fight,
		{actorid: combatant.id},
	)

	// --- Additional event handling ---
	const activeTargets = findActiveTargets(logEvents, combatant.id)
	const filter = getAdditionalEventsQuery(activeTargets, [
		combatant.id,
		...report.friendlyPets
			.filter(pet => pet.petOwner === combatant.id)
			.map(pet => pet.id),
	])
	const additionalEvents = await getFflogsEvents(
		report.code,
		fight,
		{filter},
	)
	const finalEvents = mergeEvents(logEvents, additionalEvents)

	// --- Parse into common representation ---

	// TODO: Incompat between parser and local fflogs typedefs. Same damn data source
	// so whatever. Resolve when I remove the top-level fflogs local defs and just use
	// the ones from the parser.
	const parserEvents = readFflogs(report, finalEvents as TODO)

	return parserEvents
}
