import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {assignErrorCode, getMetadataForWindow} from './EvaluatorUtilities'
import {CycleMetadata, ROTATION_ERRORS} from './WatchdogConstants'

export interface ExtraF1EvaluatorOpts {
	suggestionIcon: string
	metadataHistory: History<CycleMetadata>
	fire1Id: number
}

export class ExtraF1Evaluator implements WindowEvaluator {
	private suggestionIcon: string
	private metadataHistory: History<CycleMetadata>
	private fire1Id: number

	constructor(opts: ExtraF1EvaluatorOpts) {
		this.suggestionIcon = opts.suggestionIcon
		this.metadataHistory = opts.metadataHistory
		this.fire1Id = opts.fire1Id
	}

	private extraF1sInWindow(window: HistoryEntry<EvaluatedAction[]>) {
		const windowMetadata = getMetadataForWindow(window, this.metadataHistory)

		// Get the number of F1s used beyond the allowed amount
		const fire1Count = window.data.filter(event => this.fire1Id === event.action.id && event.timestamp > windowMetadata.firePhaseMetadata.startTime).length

		if (fire1Count > 0) {
			assignErrorCode(windowMetadata, ROTATION_ERRORS.EXTRA_F1)
		}

		return fire1Count
	}

	// Suggestion for unneccessary F1s
	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const extraF1s = windows.reduce((total, window) => {
			return total + this.extraF1sInWindow(window)
		}, 0)

		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: <Trans id="blm.rotation-watchdog.suggestions.extra-f1s.content">
				Casting <DataLink action="FIRE_I"/> will use MP that is needed to generate enough Astral Souls for <DataLink action="FLARE_STAR" />.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: extraF1s,
			why: <Trans id="blm.rotation-watchdog.suggestions.extra-f1s.why">
				You cast an extra <DataLink showIcon={false} action="FIRE_I"/> <Plural value={extraF1s} one="# time" other="# times"/>.
			</Trans>,
		})
	}

	output(_windows: Array<HistoryEntry<EvaluatedAction[]>>) { return undefined }
}
