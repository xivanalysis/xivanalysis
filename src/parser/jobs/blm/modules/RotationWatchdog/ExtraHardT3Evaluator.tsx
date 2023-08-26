import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Data} from 'parser/core/modules/Data'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import Procs from '../Procs'
import {ROTATION_ERRORS, DEFAULT_SEVERITY_TIERS, RotationMetadata} from '../RotationWatchdog'
import {assignErrorCode, getMetadataForWindow} from './EvaluatorUtilities'

export interface ExtraHardT3EvaluatorOpts {
	data: Data,
	metadataHistory: History<RotationMetadata>
	procs: Procs
}

export class ExtraHardT3Evaluator implements WindowEvaluator {
	private data: Data
	private metadataHistory: History<RotationMetadata>
	private procs: Procs

	constructor(opts: ExtraHardT3EvaluatorOpts) {
		this.data = opts.data
		this.metadataHistory = opts.metadataHistory
		this.procs = opts.procs
	}

	private extraT3sInWindow(window: HistoryEntry<EvaluatedAction[]>): number {
		const windowMetadata = getMetadataForWindow(window, this.metadataHistory)
		if (windowMetadata == null) { return 0 }
		// By definition, if you didn't miss any expected casts, you couldn't have hardcast an extra T3
		if (!(windowMetadata.missingFire4s || windowMetadata.missingDespairs)) { return 0 }

		const currentRotation = window.data
		const manafontTimestamp = currentRotation.find(event => event.action.id === this.data.actions.MANAFONT.id)?.timestamp
		const firePhaseEvents = currentRotation.filter(event => event.timestamp >= windowMetadata.firePhaseMetadata.startTime && (!manafontTimestamp || event.timestamp < manafontTimestamp))
		const manafontPhaseEvents = currentRotation.filter(event => manafontTimestamp && event.timestamp >= manafontTimestamp)

		const minimumMPForExpectedFires = this.mpCostForExpectedFires(windowMetadata, firePhaseEvents.some(event => [this.data.actions.FIRE_I.id, this.data.actions.PARADOX.id].includes(event.action.id)))

		// Figure out how many T3s we could hardcast with the MP not needed for Fires (if any)
		const maxHardcastT3s = Math.floor(Math.max(windowMetadata.firePhaseMetadata.fullElementMP - minimumMPForExpectedFires, 0) / this.data.actions.THUNDER_III.mpCost)
		const hardT3sBeforeManafont = this.hardT3sInPhase(firePhaseEvents)
		const hardT3sAfterManafont = this.hardT3sInPhase(manafontPhaseEvents)
		windowMetadata.hardT3sInFireCount = hardT3sBeforeManafont + hardT3sAfterManafont

		// Refund the T3s that dont lose us a Fire 4 from the pre-manafont hardcast count, as well as one from the post-manafont count
		const windowExtraT3s = Math.max(hardT3sBeforeManafont - maxHardcastT3s, 0) + Math.max(hardT3sAfterManafont - 1, 0)
		if (windowExtraT3s > 0) {
			assignErrorCode(windowMetadata, ROTATION_ERRORS.EXTRA_T3)
		}

		return windowExtraT3s
	}

	private mpCostForExpectedFires(windowMetadata: RotationMetadata, includedRefresh: boolean) {
		const astralFireEffectiveF4Count = windowMetadata.expectedFire4sBeforeDespair * 2 - windowMetadata.firePhaseMetadata.initialGaugeState.umbralHearts // AF makes F4 cost twice as much, but each Umbral Heart negates that for one cast
		const allowedRefreshMP = includedRefresh ? this.data.actions.PARADOX.mpCost : 0 // If they included a F1/Paradox we'll allow it. If they skipped it, that's fine too. If they have more than one, it's bad so only allow one for the MP requirement calculation.
		return (astralFireEffectiveF4Count + 1) * this.data.actions.FIRE_IV.mpCost + allowedRefreshMP // Add in the required MP cost for Despair, which happens to be the same as an F4
	}

	private hardT3sInPhase(events: EvaluatedAction[]): number {
		return events.filter(event => event.action.id === this.data.actions.THUNDER_III.id &&
			!this.procs.checkActionWasProc(event.action.id, event.timestamp)).length
	}

	// Suggestion for hard T3s under AF. Should only have one per cycle
	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const extraT3s = windows.reduce((total, window) => { return total + this.extraT3sInWindow(window) }, 0)

		// Suggestion for hard T3s under AF. Should only have one per cycle
		return new TieredSuggestion({
			icon: this.data.actions.THUNDER_III.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.wrong-t3.content">
				Don't hard cast more than one <DataLink action="THUNDER_III"/> in your Astral Fire phase, since that costs MP which could be used for more <DataLink action="FIRE_IV"/>s.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: extraT3s,
			why: <Trans id="blm.rotation-watchdog.suggestions.wrong-t3.why">
				<DataLink showIcon={false} action="THUNDER_III"/> was hard casted under Astral Fire <Plural value={extraT3s} one="# extra time" other="# extra times"/>.
			</Trans>,
		})
	}

	output(_windows: Array<HistoryEntry<EvaluatedAction[]>>) { return undefined }
}
