import {readFflogs} from '@xivanalysis/parser-reader-fflogs'
import {getFflogsEvents} from 'api'
import * as Errors from 'errors'
import {Actor, Fight} from 'fflogs'
import {Report} from 'store/report'

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
	fight?: Fight,
	combatant?: Actor,
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

	// --- Retrieve & parse fflogs events ---
	const logEvents = await getFflogsEvents(
		report.code,
		fight,
		{actorid: combatant.id},
	)

	// TODO: Incompat between parser and local fflogs typedefs. Same damn data source
	// so whatever. Resolve when I remove the top-level fflogs local defs and just use
	// the ones from the parser.
	const parserEvents = readFflogs(report, logEvents as TODO)

	return parserEvents
}
