import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import _ from 'lodash'
import {calculateExpectedGcdsForTime, EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {Gauge} from '../Gauge'
import {TECHNICAL_EXPECTED_GCDS, TECHNICAL_SEVERITY_TIERS} from '../Technicalities'

const FEATHER_THRESHHOLD = 3
const POST_WINDOW_GRACE_PERIOD_MILLIS = 500

export interface PooledFeathersEvaluatorOpts {
	pullTime: number
	pullDuration: number
	technicalDuration: number
	featherConsumerIds: number[]
	gauge: Gauge
	globalCooldown: number
	suggestionIcon: string
	windows: Array<HistoryEntry<EvaluatedAction[]>>
}

export class PooledFeathersEvaluator extends RulePassedEvaluator {
	private pullTime: number
	private pullDuration: number
	private technicalDuration: number
	private featherConsumerIds: number[]
	private gauge: Gauge
	private suggestionIcon: string
	private globalCooldown: number
	private windows: Array<HistoryEntry<EvaluatedAction[]>>

	header = {
		header: <Trans id="dnc.technicalities.rotation-table.header.pooled"><DataLink showName={false} action="FAN_DANCE" /> Pooled?</Trans>,
		accessor: 'pooled',
	}

	constructor(opts: PooledFeathersEvaluatorOpts) {
		super()
		this.pullTime = opts.pullTime
		this.pullDuration = opts.pullDuration
		this.technicalDuration = opts.technicalDuration
		this.featherConsumerIds = opts.featherConsumerIds
		this.gauge = opts.gauge
		this.globalCooldown = opts.globalCooldown
		this.suggestionIcon = opts.suggestionIcon
		this.windows = opts.windows
	}

	override suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const unpooledWindows = this.failedRuleCount(windows)
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

	override ruleContext(window: HistoryEntry<EvaluatedAction[]>) {
		if (this.windows.filter(w => w.start < window.start).length === 0) {
			return <Trans id="dnc.technicalities.unpooled.context.opener">Opener</Trans>
		}
		return <></>
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>): boolean | undefined {
		// Check to see if this window could've had more feathers due to possible pooling problems
		const feathersUsed = window.data.filter(event => this.featherConsumerIds.includes(event.action.id)).length
		if (feathersUsed >= FEATHER_THRESHHOLD) {
			return true
		}

		// Grant leniency for Technical Finish windows that overlapped the end of the fight
		const fightEnd = this.pullTime+ this.pullDuration
		const windowEnd = (window.end ?? fightEnd)
		if (windowEnd === fightEnd && windowEnd - window.start < this.technicalDuration) {
			// Should be able to weave at least one feather after each GCD, but don't count the last one in case the fight ended right as it hit
			const potentialWeaves = calculateExpectedGcdsForTime(TECHNICAL_EXPECTED_GCDS, this.globalCooldown, window.start, windowEnd) - 1
			if (feathersUsed >= potentialWeaves) {
				return true
			}
		}

		// If this is the opener window, we're not evaluating it
		const previousWindowEnd = _.max(this.windows.filter(w => (w.end ?? fightEnd) < window.start).map(w => w.end))
		if (previousWindowEnd == null) {
			return undefined
		}

		// Best be saving those feathers for this window
		const feathersBeforeWindow = this.gauge.feathersSpentInRange(previousWindowEnd + POST_WINDOW_GRACE_PERIOD_MILLIS, window.start)
		return feathersBeforeWindow === 0
	}
}
