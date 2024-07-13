import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import {DEFAULT_SEVERITY_TIERS} from 'parser/jobs/dnc/CommonData'
import React from 'react'
import {getMetadataForWindow} from './EvaluatorUtilities'
import {CycleMetadata, DEATH_PRIORITY} from './WatchdogConstants'

export interface FlareStarUsageEvaluatorOpts {
	suggestionIcon: string
	metadataHistory: History<CycleMetadata>
}

export class FlareStarUsageEvaluator extends RulePassedEvaluator {
	private suggestionIcon: string
	private metadataHistory: History<CycleMetadata>

	override header = undefined

	constructor(opts: FlareStarUsageEvaluatorOpts) {
		super()

		this.suggestionIcon = opts.suggestionIcon
		this.metadataHistory = opts.metadataHistory
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		const windowMetadata = getMetadataForWindow(window, this.metadataHistory)

		// If they died on this window, don't count it for the suggestion so we don't double-ding them
		if (windowMetadata.errorCode.priority !== DEATH_PRIORITY) {
			return
		}

		return !windowMetadata.missingFlareStars
	}

	// Suggestion not to icemage, but don't double-count it if they got cut short or we otherwise weren't showing it in the errors table
	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const rotationsMissingFlareStars = this.failedRuleCount(windows)

		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: <Trans id="blm.rotation-watchdog.suggestions.flarestarusage.content">
				<DataLink action="FLARE_STAR" /> is a powerful finisher for your Astral Fire phase. Make sure you use every one that you generate.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: rotationsMissingFlareStars,
			why: <Trans id="blm.rotation-watchdog.suggestions.flarestarusage.why">
				<Plural value={rotationsMissingFlareStars} one="# rotation" other="# rotations"/> did not use all generated <DataLink showIcon={false} action="FLARE_STAR" />s.
			</Trans>,
		})
	}
}
