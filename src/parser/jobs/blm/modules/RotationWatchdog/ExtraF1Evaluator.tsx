import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import {DEFAULT_SEVERITY_TIERS} from 'parser/jobs/dnc/CommonData'
import React from 'react'
import {assignErrorCode, getMetadataForWindow} from './EvaluatorUtilities'
import {CycleMetadata, ROTATION_ERRORS} from './WatchdogConstants'

export interface ExtraF1EvaluatorOpts {
	suggestionIcon: string
	metadataHistory: History<CycleMetadata>
	limitedFireSpellIds: number[]
}

export class ExtraF1Evaluator implements WindowEvaluator {
	private suggestionIcon: string
	private metadataHistory: History<CycleMetadata>
	private limitedFireSpellIds: number[]

	constructor(opts: ExtraF1EvaluatorOpts) {
		this.suggestionIcon = opts.suggestionIcon
		this.metadataHistory = opts.metadataHistory
		this.limitedFireSpellIds = opts.limitedFireSpellIds
	}

	private extraF1sInWindow(window: HistoryEntry<EvaluatedAction[]>) {
		const windowMetadata = getMetadataForWindow(window, this.metadataHistory)

		// If the fire phase began with Transpose -> Paradox -> F1, allow those two casts (but no more). Otherwise, allow one cast for AF refresh
		const allowedF1s = windowMetadata.wasTPF1 ? 2 : 1

		// Get the number of F1s used beyond the allowed amount
		const extraFire1Count = Math.max(window.data.filter(event => this.limitedFireSpellIds.includes(event.action.id) && event.timestamp > windowMetadata.firePhaseMetadata.startTime).length - allowedF1s, 0)

		if (extraFire1Count > 0) {
			assignErrorCode(windowMetadata, ROTATION_ERRORS.EXTRA_F1)
		}

		return extraFire1Count
	}

	// Suggestion for unneccessary extra F1s
	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const extraF1s = windows.reduce((total, window) => {
			return total + this.extraF1sInWindow(window)
		}, 0)

		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: <Trans id="blm.rotation-watchdog.suggestions.extra-f1s.content">
				Casting more than one <DataLink action="FIRE_I"/> per Astral Fire cycle is a crutch that should be avoided by better pre-planning of the encounter.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: extraF1s,
			why: <Trans id="blm.rotation-watchdog.suggestions.extra-f1s.why">
				You cast an extra <DataLink showIcon={false} action="FIRE_I"/> <Plural value={extraF1s} one="# time" other="# times"/>.
			</Trans>,
		})
	}

	output(_windows: Array<HistoryEntry<EvaluatedAction[]>>) { return undefined }
}
