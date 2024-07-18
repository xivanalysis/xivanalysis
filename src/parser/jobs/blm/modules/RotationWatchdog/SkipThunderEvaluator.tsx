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
	thunderSpellIds: number[]
	metadataHistory: History<CycleMetadata>
}

export class SkipThunderEvaluator implements WindowEvaluator {
	private suggestionIcon: string
	private thunderSpellIds: number[]
	private metadataHistory: History<CycleMetadata>

	constructor(opts: SkipThunderEvaluatorOpts) {
		this.suggestionIcon = opts.suggestionIcon
		this.thunderSpellIds = opts.thunderSpellIds
		this.metadataHistory = opts.metadataHistory
	}

	// Suggestion for skipping thunder on rotations that are cut short by the end of the parse or downtime
	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const shouldSkipThunders = windows.reduce((total, window) => {
			const windowMetadata = getMetadataForWindow(window, this.metadataHistory)

			if (!windowMetadata.finalOrDowntime) { return total } // This suggestion only applies to windows that end with downtime

			const firePhaseEvents = window.data.filter(event => event.timestamp >= windowMetadata.firePhaseMetadata.startTime)
			const thundersInFireCount = firePhaseEvents.filter(event => this.thunderSpellIds.includes(event.action.id)).length

			// Thunder initial potency isn't worth it if the DoT is going to go to waste before the boss jumps or dies, and a fire spell could have been used instead
			if (thundersInFireCount > 0 && (windowMetadata.missingFire4s || windowMetadata.missingDespairs || windowMetadata.missingFlareStars)) {
				assignErrorCode(windowMetadata, ROTATION_ERRORS.SHOULD_SKIP_T3)
				return total + thundersInFireCount
			}

			return total
		}, 0)

		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: <Trans id="blm.rotation-watchdog.suggestions.should-skip-thunder.content">
				You lost at least one fire element spell by casting <DataLink action="HIGH_THUNDER"/> before the fight finished or a phase transition occurred.
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
