import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {assignErrorCode} from './EvaluatorUtilities'
import {CycleMetadata, ROTATION_ERRORS, ENHANCED_SEVERITY_TIERS} from './WatchdogConstants'

export interface ManafontTimingEvaluatorOpts {
	manafontAction: Action
	despairId: number
	metadataHistory: History<CycleMetadata>
}

export class ManafontTimingEvaluator extends RulePassedEvaluator {
	private manafontAction: Action
	private despairId: number
	private metadataHistory: History<CycleMetadata>

	override header = undefined

	constructor(opts: ManafontTimingEvaluatorOpts) {
		super()

		this.manafontAction = opts.manafontAction
		this.despairId = opts.despairId
		this.metadataHistory = opts.metadataHistory
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		const windowMetadata = this.metadataHistory.entries.find(entry => entry.start === window.start)?.data
		if (windowMetadata == null) { return }

		const manafontIndex = window.data.findIndex(event => event.action.id === this.manafontAction.id)
		if (manafontIndex === -1) { return }

		const despairIndex = window.data.findIndex(event => event.action.id === this.despairId)
		if (manafontIndex < despairIndex || despairIndex === -1) {
			assignErrorCode(windowMetadata, ROTATION_ERRORS.MANAFONT_BEFORE_DESPAIR)
			return false
		}

		return true
	}

	// Suggestion to not use Manafont before Despair
	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const manafontsBeforeDespair = this.failedRuleCount(windows)

		return new TieredSuggestion({
			icon: this.manafontAction.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.mf-before-despair.content">
				Using <DataLink action="MANAFONT"/> before <DataLink action="DESPAIR"/> leads to fewer <DataLink showIcon={false} action="DESPAIR"/>s than possible being cast. Try to avoid that since <DataLink showIcon={false} action="DESPAIR"/> is stronger than <DataLink action="FIRE_IV"/>.
			</Trans>,
			tiers: ENHANCED_SEVERITY_TIERS,
			value: manafontsBeforeDespair,
			why: <Trans id="blm.rotation-watchdog.suggestions.mf-before-despair.why">
				<DataLink showIcon={false} action="MANAFONT"/> was used before <DataLink action="DESPAIR"/> <Plural value={manafontsBeforeDespair} one="# time" other="# times"/>.
			</Trans>,
		})
	}
}
