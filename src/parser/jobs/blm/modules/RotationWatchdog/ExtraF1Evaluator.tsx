import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
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

export class ExtraF1Evaluator extends RulePassedEvaluator {
	private suggestionIcon: string
	private metadataHistory: History<CycleMetadata>
	private fire1Id: number

	override header = undefined

	constructor(opts: ExtraF1EvaluatorOpts) {
		super()

		this.suggestionIcon = opts.suggestionIcon
		this.metadataHistory = opts.metadataHistory
		this.fire1Id = opts.fire1Id
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		const windowMetadata = getMetadataForWindow(window, this.metadataHistory)

		// Figure out if the window contained any cases of Fire 1
		const containsFireOne = window.data.some(event => event.action.id === this.fire1Id)

		// All fire 1 usage is bad now
		if (containsFireOne) {
			assignErrorCode(windowMetadata, ROTATION_ERRORS.EXTRA_F1)
		}

		return !containsFireOne
	}

	// Suggestion for unneccessary F1s
	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const extraF1s = this.failedRuleCount(windows)

		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: <Trans id="blm.rotation-watchdog.suggestions.extra-f1s.content">
				Casting <DataLink action="FIRE_I"/> will use MP that is needed to generate enough Astral Souls for <DataLink action="FLARE_STAR" />. Use <DataLink action="PARADOX" /> or your <DataLink status="FIRESTARTER" /> procs to keep your Astral Fire timer running instead.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: extraF1s,
			why: <Trans id="blm.rotation-watchdog.suggestions.extra-f1s.why">
				<Plural value={extraF1s} one="# Astral Fire phase" other="# Astral Fire phases"/> lost a <DataLink showIcon={false} action="FLARE_STAR" /> due to casting <DataLink showIcon={false} action="FIRE_I"/>.
			</Trans>,
		})
	}
}
