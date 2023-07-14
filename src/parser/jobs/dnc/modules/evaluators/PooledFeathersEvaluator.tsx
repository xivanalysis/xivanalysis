import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {Gauge} from '../Gauge'
import {TECHNICAL_SEVERITY_TIERS} from '../Technicalities'

const FEATHER_THRESHHOLD = 3
const POST_WINDOW_GRACE_PERIOD_MILLIS = 500

export interface PooledFeathersEvaluatorOpts {
	pullTime: number
	pullDuration: number
	gauge: Gauge
	suggestionIcon: string
	windows: Array<HistoryEntry<EvaluatedAction[]>>
}

export class PooledFeathersEvaluator extends RulePassedEvaluator {
	private pullTime: number
	private pullDuration: number
	private gauge: Gauge
	private suggestionIcon: string
	private windows: Array<HistoryEntry<EvaluatedAction[]>>

	header = {
		header: <Trans id="dnc.technicalities.rotation-table.header.pooled"><DataLink showName={false} action="FAN_DANCE" /> Pooled?</Trans>,
		accessor: 'pooled',
	}

	constructor(opts: PooledFeathersEvaluatorOpts) {
		super()
		this.pullTime = opts.pullTime
		this.pullDuration = opts.pullDuration
		this.gauge = opts.gauge
		this.suggestionIcon = opts.suggestionIcon
		this.windows = opts.windows
	}

	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const unpooledWindows = windows.filter(window => this.passesRule(window) === false).length
		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: <Trans id="dnc.technicalities.suggestions.unpooled.content">
				Pooling your Feathers before going into a <DataLink status="TECHNICAL_FINISH" /> window allows you to use more <DataLink action="FAN_DANCE" />s with the multiplicative bonuses active, increasing their effectiveness. Try to build and hold on to at least three feathers between windows.
			</Trans>,
			tiers: TECHNICAL_SEVERITY_TIERS,
			value: unpooledWindows,
			why: <Trans id="dnc.technicalities.suggestions.unpooled.why">
				<Plural value={unpooledWindows} one="# window was" other="# windows were"/> missing potential <DataLink action="FAN_DANCE" />s.
			</Trans>,
		})
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>): boolean | undefined {
		// Check to see if this window could've had more feathers due to possible pooling problems
		if (this.gauge.feathersSpentInRange(window.start, window.end ?? (this.pullTime + this.pullDuration)) >= FEATHER_THRESHHOLD) {
			return true
		}
		const previousWindow = this.windows[this.windows.indexOf(window)-1]
		if (previousWindow == null) {
			return undefined
		}
		const feathersBeforeWindow = this.gauge.feathersSpentInRange((previousWindow && previousWindow.end || this.pullTime)
			+ POST_WINDOW_GRACE_PERIOD_MILLIS, window.start)

		return feathersBeforeWindow === 0
	}
}
