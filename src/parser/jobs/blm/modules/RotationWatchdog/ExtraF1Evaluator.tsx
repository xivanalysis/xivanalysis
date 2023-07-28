import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Data} from 'parser/core/modules/Data'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {ROTATION_ERRORS, DEFAULT_SEVERITY_TIERS, RotationMetadata} from '../RotationWatchdog'
import {assignErrorCode, getMetadataForWindow} from './EvaluatorUtilities'

export interface ExtraF1EvaluatorOpts {
	data: Data,
	metadataHistory: History<RotationMetadata>
	fireSpellIds: number[]
}

export class ExtraF1Evaluator implements WindowEvaluator {
	private data: Data
	private metadataHistory: History<RotationMetadata>
	private fireSpellIds: number[]

	constructor(opts: ExtraF1EvaluatorOpts) {
		this.data = opts.data
		this.metadataHistory = opts.metadataHistory
		this.fireSpellIds = opts.fireSpellIds
	}

	// Suggestion for unneccessary extra F1s
	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const extraF1s = windows.reduce((total, window) => {
			const windowMetadata = getMetadataForWindow(window, this.metadataHistory)
			if (windowMetadata == null) { return total }

			// Check if the rotation included more than one Fire 1
			const currentRotation = window.data
			const firePhaseStartIndex = currentRotation.findIndex(event => this.fireSpellIds.includes(event.action.id))
			const extraFire1Count = Math.max(currentRotation.filter(event => [this.data.actions.FIRE_I.id, this.data.actions.PARADOX.id].includes(event.action.id) && currentRotation.indexOf(event) >= firePhaseStartIndex).length - 1, 0)

			if (extraFire1Count > 0) {
				assignErrorCode(windowMetadata, ROTATION_ERRORS.EXTRA_F1)
				return total + extraFire1Count
			}
			return total
		}, 0)

		return new TieredSuggestion({
			icon: this.data.actions.FIRE_I.icon,
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
