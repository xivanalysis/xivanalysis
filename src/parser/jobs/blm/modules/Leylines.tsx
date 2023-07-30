import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, EvaluatedAction} from 'parser/core/modules/ActionWindow'
import {RulePassedEvaluator} from 'parser/core/modules/ActionWindow/evaluators/RulePassedEvaluator'
import {History, HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import CastTime from 'parser/core/modules/CastTime'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import {SimpleRow, StatusItem} from 'parser/core/modules/Timeline'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

//pretty random. Should be revised, maybe based on fights? 10% is ~ 1 GCD. So we allow that.
const TARGET_UPTIME_PCT = 90

interface CircleOfPowerUptimeEvaluatorOpts {
	pullEnd: number,
	circleOfPowerId: number
	getStatusDurationInRange : (status: number, start: number, end: number) => number
	dontMovePercent : (numerator: number, denominator: number) => number
}

class CircleOfPowerUptimeEvaluator extends RulePassedEvaluator {
	private pullEnd: number
	private circleOfPowerId: number
	private getStatusDurationInRange : (status: number, start: number, end: number) => number
	private dontMovePercent : (numerator: number, denominator: number) => number

	override header = {
		header: <Trans id="blm.leylines.uptime-header">Uptime</Trans>,
		accessor: 'powertime',
	}

	constructor(opts: CircleOfPowerUptimeEvaluatorOpts) {
		super()
		this.pullEnd = opts.pullEnd
		this.circleOfPowerId = opts.circleOfPowerId
		this.getStatusDurationInRange = opts.getStatusDurationInRange
		this.dontMovePercent = opts.dontMovePercent
	}

	override passesRule(window: HistoryEntry<EvaluatedAction[]>) {
		return this.getUptimeForWindow(window) >= TARGET_UPTIME_PCT
	}

	override ruleContext(window: HistoryEntry<EvaluatedAction[]>) {
		return this.getUptimeForWindow(window).toFixed(2) + '%'
	}

	private getUptimeForWindow(window: HistoryEntry<EvaluatedAction[]>) {
		const linesDuration = (window.end ?? this.pullEnd) - window.start
		const copDuration = this.getStatusDurationInRange(this.circleOfPowerId, window.start, window.end ?? this.pullEnd)
		return this.dontMovePercent(copDuration, linesDuration)
	}
}

export default class Leylines extends BuffWindow {
	static override handle = 'leylines'
	static override title = t('blm.leylines.title')`Ley Lines`
	static override displayOrder = DISPLAY_ORDER.LEY_LINES

	@dependency private checklist!: Checklist
	@dependency private castTime!: CastTime

	override buffStatus = [this.data.statuses.LEY_LINES]

	private circleOfPowerHistory = new History<null>(() => null)
	private castTimeIndex: number | null = null

	override initialise() {
		super.initialise()

		const circleOfPowerFilter = filter<Event>()
			.source(this.parser.actor.id)
			.status(this.data.statuses.CIRCLE_OF_POWER.id)
		this.addEventHook(circleOfPowerFilter.type('statusApply'), this.onGainCircle)
		this.addEventHook(circleOfPowerFilter.type('statusRemove'), this.onDropCircle)
		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onDeath)

		this.addEvaluator(new CircleOfPowerUptimeEvaluator({
			pullEnd: this.parser.pull.timestamp + this.parser.pull.duration,
			circleOfPowerId: this.data.statuses.CIRCLE_OF_POWER.id,
			getStatusDurationInRange: this.getStatusDurationInRange.bind(this),
			dontMovePercent: this.dontMovePercent.bind(this),
		}))
	}

	public getStatusDurationInRange(
		statusId: number,
		start: number = this.parser.pull.timestamp,
		end: number = this.parser.pull.timestamp + this.parser.pull.duration
	) {
		const history = statusId === this.data.statuses.LEY_LINES.id ? this.history : this.circleOfPowerHistory
		return history.entries.map(window => {
			return {
				start: window.start,
				end: window.end ?? end,
			}
		}).reduce((total, window) => {
			if (window.end <= start || window.start >= end) {
				return total
			}
			return total + Math.max(0, Math.min(window.end, end) - Math.max(window.start, start))
		}, 0)
	}

	// Manage circle of power windows
	private onGainCircle(event: Events['statusApply']) {
		this.circleOfPowerHistory.getCurrentOrOpenNew(event.timestamp)

		this.castTimeIndex = this.castTime.setPercentageAdjustment('all', this.data.statuses.CIRCLE_OF_POWER.speedModifier, 'both')
	}

	private onDropCircle(event: Events['statusRemove']) {
		this.stopAndSave(event.timestamp)
	}

	// We died, make sure circle of power gets closed
	private onDeath(event: Events['death']) {
		this.stopAndSave(event.timestamp)
	}

	// Finalise a buff window
	private stopAndSave(endTime: number = this.parser.currentEpochTimestamp) {
		this.circleOfPowerHistory.closeCurrent(endTime)

		this.castTime.reset(this.castTimeIndex)
		this.castTimeIndex = null
	}

	// A reminder of man's ability to generate electricity
	private dontMovePercent(power: number, lines: number) {
		return (power / lines) * 100
	}

	override onComplete() {
		// Current time will be end of fight so no need to pass it here
		this.stopAndSave(this.data.statuses.CIRCLE_OF_POWER.id)

		super.onComplete()

		// Build the grouping row
		const parentRow = this.timeline.addRow(new SimpleRow({
			label: 'Ley Lines Buffs',
			order: 0,
		}))

		// For each buff, add it to timeline
		this.addHistoryToTimeline(this.data.statuses.LEY_LINES, this.history, parentRow)
		this.addHistoryToTimeline(this.data.statuses.CIRCLE_OF_POWER, this.circleOfPowerHistory, parentRow)

		// Get the total duration of CoP uptime and Ley Lines, so we can get the overall percentage uptime
		const copDuration = this.getStatusDurationInRange(this.data.statuses.CIRCLE_OF_POWER.id)
		const linesDuration = this.getStatusDurationInRange(this.data.statuses.LEY_LINES.id)

		this.checklist.add(new Rule({
			name: <Trans id="blm.leylines.checklist-caption">Stay in your <ActionLink {...this.data.actions.LEY_LINES} /></Trans>,
			description: <Trans id="blm.leylines.checklist">Try to avoid leaving your <ActionLink showIcon={false} {...this.data.actions.LEY_LINES} /> after placing them. Take advantage of <ActionLink showIcon={false} {...this.data.actions.LEY_LINES} />' size to stay in them while dodging AOEs and being in range of healers. If you can't stay in them for the majority of a <ActionLink showIcon={false} {...this.data.actions.LEY_LINES} />' duration, consider changing where they're placed in the fight.</Trans>,
			requirements: [
				new Requirement({
					name: <ActionLink {...this.data.actions.LEY_LINES} />,
					percent: this.dontMovePercent(copDuration, linesDuration),
				}),
			],
			target: TARGET_UPTIME_PCT,
		}))
	}

	private addHistoryToTimeline(status: Status, history: History<Array<Events['action']> | null>, parentRow: SimpleRow) {
		const row = parentRow.addRow(new SimpleRow({label: status.name}))
		const fightStart = this.parser.pull.timestamp
		history.entries.forEach(window => {
			if (window.end == null) { return }
			row.addItem(new StatusItem({
				status,
				start: window.start - fightStart,
				end: window.end - fightStart,
			}))
		})
	}
}
