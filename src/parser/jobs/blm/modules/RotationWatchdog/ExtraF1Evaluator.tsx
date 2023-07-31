import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {ROTATION_ERRORS, DEFAULT_SEVERITY_TIERS, RotationMetadata} from '../RotationWatchdog'
import {assignErrorCode, getMetadataForWindow} from './EvaluatorUtilities'

export interface ExtraF1EvaluatorOpts {
	suggestionIcon: string
	metadataHistory: History<RotationMetadata>
	allFireSpellIds: number[]
	limitedFireSpellIds: number[]
}

export class ExtraF1Evaluator implements WindowEvaluator {
	private suggestionIcon: string
	private metadataHistory: History<RotationMetadata>
	private allFireSpellIds: number[]
	private limitedFireSpellIds: number[]

	constructor(opts: ExtraF1EvaluatorOpts) {
		this.suggestionIcon = opts.suggestionIcon
		this.metadataHistory = opts.metadataHistory
		this.allFireSpellIds = opts.allFireSpellIds
		this.limitedFireSpellIds = opts.limitedFireSpellIds
	}

	private extraF1sInWindow(window: HistoryEntry<EvaluatedAction[]>) {
		const windowMetadata = getMetadataForWindow(window, this.metadataHistory)
		if (windowMetadata == null) { return 0 }

		// Check if the rotation included more than one Fire 1
		const currentRotation = window.data
		const firePhaseStartIndex = currentRotation.findIndex(event => this.allFireSpellIds.includes(event.action.id))
		const extraFire1Count = Math.max(currentRotation.filter(event => this.limitedFireSpellIds.includes(event.action.id) && currentRotation.indexOf(event) >= firePhaseStartIndex).length - 1, 0)

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
