import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {assignErrorCode, getMetadataForWindow} from './EvaluatorUtilities'
import {CycleMetadata, ROTATION_ERRORS, ENHANCED_SEVERITY_TIERS} from './WatchdogConstants'

export interface SkipThunderEvaluatorOpts {
	suggestionIcon: string
	metadataHistory: History<CycleMetadata>
}

export class SkipThunderEvaluator implements WindowEvaluator {
	private suggestionIcon: string
	private metadataHistory: History<CycleMetadata>

	constructor(opts: SkipThunderEvaluatorOpts) {
		this.suggestionIcon = opts.suggestionIcon
		this.metadataHistory = opts.metadataHistory
	}

	// Suggestion for skipping thunder on rotations that are cut short by the end of the parse or downtime
	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const shouldSkipThunders = windows.reduce((total, window) => {
			const windowMetadata = getMetadataForWindow(window, this.metadataHistory)

			if (!windowMetadata.finalOrDowntime) { return total } // This suggestion only applies to windows that end with downtime

			// Thunder initial potency isn't worth it if the DoT is going to go to waste before the boss jumps or dies
			if (windowMetadata.thundersInFireCount > 0) {
				assignErrorCode(windowMetadata, ROTATION_ERRORS.SHOULD_SKIP_T3)
			}

			return total + windowMetadata.thundersInFireCount
		}, 0)

		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: <Trans id="blm.rotation-watchdog.suggestions.should-skip-thunder.content">
				You lost at least one <DataLink action="FIRE_IV"/> by casting <DataLink action="HIGH_THUNDER"/> before the fight finished or a phase transition occurred.
			</Trans>,
			tiers: ENHANCED_SEVERITY_TIERS,
			value: shouldSkipThunders,
			why: <Trans id="blm.rotation-watchdog.suggestions.should-skip-thunder.why">
				You should have skipped <DataLink showIcon={false} action="HIGH_THUNDER"/> <Plural value={shouldSkipThunders} one="# time" other="# times"/>.
			</Trans>,
		})
	}

	output(_windows: Array<HistoryEntry<EvaluatedAction[]>>) { return undefined }
}
