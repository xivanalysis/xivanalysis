import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {ROTATION_ERRORS, ENHANCED_SEVERITY_TIERS, CycleMetadata, NO_UH_EXPECTED_FIRE4} from '../RotationWatchdog'
import {assignErrorCode, getMetadataForWindow} from './EvaluatorUtilities'

export interface SkipB4EvaluatorOpts {
	blizzard4Id: number
	fire4action: Action
	metadataHistory: History<CycleMetadata>
}

export class SkipB4Evaluator extends RulePassedEvaluator {
	private blizzard4Id: number
	private fire4action: Action
	private metadataHistory: History<CycleMetadata>

	override header = undefined

	constructor(opts: SkipB4EvaluatorOpts) {
		super()

		this.blizzard4Id = opts.blizzard4Id
		this.fire4action = opts.fire4action
		this.metadataHistory = opts.metadataHistory
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		const windowMetadata = getMetadataForWindow(window, this.metadataHistory)

		if (!windowMetadata.finalOrDowntime) { return } // This suggestion only applies to windows that end with downtime

		const currentRotation = window.data
		// B4 should be skipped for rotations that ended in downtime or the end of the fight,
		if (currentRotation.some(event => event.action.id === this.blizzard4Id) // AND the rotations had a B4 cast
			&& currentRotation.filter(event => event.action.id === this.fire4action.id).length <= NO_UH_EXPECTED_FIRE4 // AND the Umbral Hearts gained from Blizzard 4 weren't needed
		) {
			assignErrorCode(windowMetadata, ROTATION_ERRORS.SHOULD_SKIP_B4)
			return false
		}

		return true
	}

	// Suggestion for skipping B4 on rotations that are cut short by the end of the parse or downtime
	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const shouldSkipB4s = this.failedRuleCount(windows)

		return new TieredSuggestion({
			icon: this.fire4action.icon,
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
}
