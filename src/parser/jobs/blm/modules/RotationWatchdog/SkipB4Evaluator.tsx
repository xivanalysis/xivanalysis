import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Data} from 'parser/core/modules/Data'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {ROTATION_ERRORS, ENHANCED_SEVERITY_TIERS, RotationMetadata, NO_UH_EXPECTED_FIRE4} from '../RotationWatchdog'
import {assignErrorCode} from './EvaluatorUtilities'

export interface SkipB4EvaluatorOpts {
	data: Data,
	metadataHistory: History<RotationMetadata>
}

export class SkipB4Evaluator implements WindowEvaluator {
	private data: Data
	private metadataHistory: History<RotationMetadata>

	constructor(opts: SkipB4EvaluatorOpts) {
		this.data = opts.data
		this.metadataHistory = opts.metadataHistory
	}

	// Suggestion for skipping B4 on rotations that are cut short by the end of the parse or downtime
	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const shouldSkipB4s = windows.reduce((total, window) => {
			const windowMetadata = this.metadataHistory.entries.find(entry => entry.start === window.start)?.data
			if (windowMetadata == null) { return total }
			if (!windowMetadata.finalOrDowntime) { return total } // This suggestion only applies to windows that end with downtime

			const currentRotation = window.data
			// B4 should be skipped for rotations that ended in downtime or the end of the fight,
			if (currentRotation.some(event => event.action.id === this.data.actions.BLIZZARD_IV.id) // AND the rotations had a B4 cast
				&& currentRotation.filter(event => event.action.id === this.data.actions.FIRE_IV.id).length <= NO_UH_EXPECTED_FIRE4 // AND the Umbral Hearts gained from Blizzard 4 weren't needed
			) {
				assignErrorCode(windowMetadata, ROTATION_ERRORS.SHOULD_SKIP_B4)
				return total + 1
			}

			return total
		}, 0)

		return new TieredSuggestion({
			icon: this.data.actions.FIRE_IV.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.should-skip-b4.content">
				You lost at least one <DataLink action="FIRE_IV"/> by not skipping <DataLink action="BLIZZARD_IV"/> in an Umbral Ice phase before the fight finished or a phase transition occurred.
			</Trans>,
			tiers: ENHANCED_SEVERITY_TIERS,
			value: shouldSkipB4s,
			why: <Trans id="blm.rotation-watchdog.suggestions.should-skip-b4.why">
				You should have skipped <DataLink showIcon={false} action="BLIZZARD_IV"/> <Plural value={shouldSkipB4s} one="# time" other="# times"/>.
			</Trans>,
		})
	}

	output(_windows: Array<HistoryEntry<EvaluatedAction[]>>) { return undefined }
}
