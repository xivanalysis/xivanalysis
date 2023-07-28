import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Data} from 'parser/core/modules/Data'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {ROTATION_ERRORS, ENHANCED_SEVERITY_TIERS, RotationMetadata} from '../RotationWatchdog'
import {assignErrorCode} from './EvaluatorUtilities'

export interface SkipT3EvaluatorOpts {
	data: Data,
	metadataHistory: History<RotationMetadata>
}

export class SkipT3Evaluator implements WindowEvaluator {
	private data: Data
	private metadataHistory: History<RotationMetadata>

	constructor(opts: SkipT3EvaluatorOpts) {
		this.data = opts.data
		this.metadataHistory = opts.metadataHistory
	}

	// Suggestion for skipping T3 on rotations that are cut short by the end of the parse or downtime
	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const shouldSkipT3s = windows.reduce((total, window) => {
			const windowMetadata = this.metadataHistory.entries.find(entry => entry.start === window.start)?.data
			if (windowMetadata == null) { return total }
			if (!windowMetadata.finalOrDowntime) { return total } // This suggestion only applies to windows that end with downtime

			// Hardcasted T3's initial potency isn't worth it if the DoT is going to go to waste before the boss jumps or dies
			if (windowMetadata.hardT3sInFireCount > 0) {
				assignErrorCode(windowMetadata, ROTATION_ERRORS.SHOULD_SKIP_T3)
			}

			return total + windowMetadata.hardT3sInFireCount
		}, 0)

		return new TieredSuggestion({
			icon: this.data.actions.FIRE_IV.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.should-skip-t3.content">
				You lost at least one <DataLink action="FIRE_IV"/> by hard casting <DataLink action="THUNDER_III"/> before the fight finished or a phase transition occurred.
			</Trans>,
			tiers: ENHANCED_SEVERITY_TIERS,
			value: shouldSkipT3s,
			why: <Trans id="blm.rotation-watchdog.suggestions.should-skip-t3.why">
				You should have skipped <DataLink showIcon={false} action="THUNDER_III"/> <Plural value={shouldSkipT3s} one="# time" other="# times"/>.
			</Trans>,
		})
	}

	output(_windows: Array<HistoryEntry<EvaluatedAction[]>>) { return undefined }
}
