import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY, SeverityTiers, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {OverlapStatus} from '../Brotherhood'

export interface BrotherhoodEvaluatorOpts {
	suggestionIcon: string
	getOverlapStatus: (window: HistoryEntry<EvaluatedAction[]>) => OverlapStatus
}

export class BrotherhoodDriftEvaluator extends RulePassedEvaluator {
	private suggestionIcon: string
	private getOverlapStatus: (window: HistoryEntry<EvaluatedAction[]>) => OverlapStatus

	constructor(opts: BrotherhoodEvaluatorOpts) {
		super()
		this.suggestionIcon = opts.suggestionIcon
		this.getOverlapStatus = opts.getOverlapStatus
	}

	header = {
		header: <Trans id="mnk.brotherhood.drift.header">Used inside<br/><DataLink action="RIDDLE_OF_FIRE" showIcon={false}/>?</Trans>,
		accessor: 'brotherhoodstatus',
	}

	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>): Suggestion | undefined {
		const windowStatuses = windows.map(window => this.getOverlapStatus(window))
		const driftedWindows = windowStatuses.filter(w => w === OverlapStatus.USED_EARLY || w === OverlapStatus.USED_LATE)
		if (driftedWindows.length === 0) {
			return undefined
		}

		return new Suggestion({
			icon: this.suggestionIcon,
			content: <Trans id="mnk.brotherhood.drifted-window.content.">
				Try and make sure your <DataLink action="BROTHERHOOD"/> casts are fully included within a <DataLink action="RIDDLE_OF_FIRE"/> window.
			</Trans>,
			severity: SEVERITY.MINOR,
			why: <Trans id="mnk.brotherhood.drifted-window.why">
				<Plural value={driftedWindows.length} one="# cast" other="# casts"/> of <DataLink action="BROTHERHOOD"/> <Plural value={driftedWindows.length} one="was" other="were"/> either early or late for a <DataLink action="RIDDLE_OF_FIRE"/> window.
			</Trans>,
		})
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		return this.getOverlapStatus(window) === OverlapStatus.IN_WINDOW
	}

	override ruleContext(window: HistoryEntry<EvaluatedAction[]>) {
		const overlapStatus = this.getOverlapStatus(window)

		switch (overlapStatus) {
		case OverlapStatus.USED_EARLY:
			return <Trans id="mnk.rof.chart.notes.late">Used Early</Trans>
		case OverlapStatus.USED_LATE:
			return <Trans id="mnk.rof.chart.notes.early">Used Late</Trans>
		case OverlapStatus.IN_WINDOW:
			return <Trans id="mnk.rof.chart.notes.inwindow">In Window</Trans>
		default:
			return <Trans id="mnk.rof.chart.notes.missed">Missed Window</Trans>
		}
	}
}

const MISSED_BROTHERHOOD_TIERS: SeverityTiers = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

export class MissedBrotherhoodEvaluator extends RulePassedEvaluator {
	private suggestionIcon: string
	private getOverlapStatus: (window: HistoryEntry<EvaluatedAction[]>) => OverlapStatus

	constructor(opts: BrotherhoodEvaluatorOpts) {
		super()
		this.suggestionIcon = opts.suggestionIcon
		this.getOverlapStatus = opts.getOverlapStatus
	}

	override header = undefined

	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>): Suggestion | undefined {
		const missedWindows = this.failedRuleCount(windows)

		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: <Trans id="mnk.brotherhood.missed-window.content">
				Try and make sure your <DataLink action="BROTHERHOOD"/> casts line up with your <DataLink action="RIDDLE_OF_FIRE"/> windows to maximize buff stacking.
			</Trans>,
			tiers: MISSED_BROTHERHOOD_TIERS,
			value: missedWindows,
			why: <Trans id="mnk.brotherhood.missed-window.why">
				<Plural value={missedWindows} one="# cast" other="# casts"/> of <DataLink action="BROTHERHOOD"/> did not occur during a <DataLink status="RIDDLE_OF_FIRE"/> window.
			</Trans>,
		})
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		return this.getOverlapStatus(window) !== OverlapStatus.OUT_OF_WINDOW
	}
}
