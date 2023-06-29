import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {EvaluatedAction, EvaluationOutput, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Data} from 'parser/core/modules/Data'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import Parser from 'parser/core/Parser'
import React from 'react'
import {Icon} from 'semantic-ui-react'
import {Gauge} from '../Gauge'
import {TECHNICAL_SEVERITY_TIERS} from '../Technicalities'

const FEATHER_THRESHHOLD = 3
const POST_WINDOW_GRACE_PERIOD_MILLIS = 500

export interface PooledFeathersEvaluatorOpts {
	parser?: Parser
	gauge?: Gauge
	data?: Data
}

export class PooledFeathersEvaluator implements WindowEvaluator {
	private _parser?: Parser
	private _gauge?: Gauge
	private _data?: Data

	constructor(opts: PooledFeathersEvaluatorOpts) {
		this._parser = opts.parser
		this._gauge = opts.gauge
		this._data = opts.data
	}

	protected get parser() {
		if (!this._parser) {
			throw new Error('No parser found. Ensure this evaluator is being initialised with a reference to the parser.')
		}

		return this._parser
	}

	protected get gauge() {
		if (!this._gauge) {
			throw new Error('No gauge found. Ensure this evaluator is being initialised with a reference to the gauge.')
		}

		return this._gauge
	}

	protected get data() {
		if (!this._data) {
			throw new Error('No data found. Ensure this evaluator is being initialised with a reference to the data.')
		}

		return this._data
	}

	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const unpooledWindows = windows.filter(window => this.determinePooled(windows, windows.indexOf(window))).length
		return new TieredSuggestion({
			icon: this.data.actions.FAN_DANCE.icon,
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

	output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput {
		return {
			format: 'notes',
			header: {
				header: <Trans id="dnc.technicalities.rotation-table.header.pooled"><DataLink showName={false} action="FAN_DANCE" /> Pooled?</Trans>,
				accessor: 'pooled',
			},
			rows: windows.map(window => {
				return <>{this.getNotesIcon(this.determinePooled(windows, windows.indexOf(window)))}</>
			}),
		}
	}

	private determinePooled(windows: Array<HistoryEntry<EvaluatedAction[]>>, windowIndex: number): boolean {
		const window = windows[windowIndex]
		let poolingProblem = false
		// Check to see if this window could've had more feathers due to possible pooling problems
		if (this.gauge.feathersSpentInRange(window.start, window.end ?? this.parser.pull.timestamp + this.parser.pull.duration) < FEATHER_THRESHHOLD) {
			const previousWindow = windows[windowIndex-1]
			const feathersBeforeWindow = this.gauge.feathersSpentInRange((previousWindow && previousWindow.end || this.parser.pull.timestamp)
				+ POST_WINDOW_GRACE_PERIOD_MILLIS, window.start)
			poolingProblem = feathersBeforeWindow > 0
		} else {
			poolingProblem = false
		}
		return poolingProblem
	}

	private getNotesIcon(ruleFailed: boolean) {
		return <Icon
			name={ruleFailed ? 'remove' : 'checkmark'}
			className={ruleFailed ? 'text-error' : 'text-success'}
		/>
	}
}
