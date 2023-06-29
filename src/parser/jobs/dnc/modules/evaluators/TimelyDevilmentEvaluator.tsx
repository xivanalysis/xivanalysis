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

export interface TimelyDevilmentEvaluatorOpts {
	parser?: Parser
	gauge?: Gauge
	data?: Data
}

export class TimelyDevilmentEvaluator implements WindowEvaluator {
	private _parser?: Parser
	private _gauge?: Gauge
	private _data?: Data

	constructor(opts: TimelyDevilmentEvaluatorOpts) {
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
		const lateDevilments = windows.filter(window => this.determineTimely(window) === false).length
		return new TieredSuggestion({
			icon: this.data.actions.DEVILMENT.icon,
			content: <Trans id="dnc.technicalities.suggestions.late-devilments.content">
				Using <DataLink action="DEVILMENT" /> as early as possible during your <DataLink status="TECHNICAL_FINISH" /> windows allows you to maximize the multiplicative bonuses that both statuses give you. It should be used immediately after <DataLink action="TECHNICAL_FINISH" />.
			</Trans>,
			tiers: TECHNICAL_SEVERITY_TIERS,
			value: lateDevilments,
			why: <Trans id="dnc.technicalities.suggestions.late-devilments.why">
				<Plural value={lateDevilments} one="# Devilment was" other="# Devilments were"/> used later than optimal.
			</Trans>,
		})
	}

	output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput {
		return {
			format: 'notes',
			header: {
				header: <Trans id="dnc.technicalities.rotation-table.header.missed"><DataLink showName={false} action="DEVILMENT" /> On Time?</Trans>,
				accessor: 'timely',
			},
			rows: windows.map(window => {
				return <>{this.getNotesIcon(this.determineTimely(window))}</>
			}),
		}
	}

	private determineTimely(window: HistoryEntry<EvaluatedAction[]>): boolean | undefined {
		if (window.data.filter(entry => entry.action.id === this.data.actions.DEVILMENT.id).length === 0) {
			return
		}
		// If the window actually contains Devilment, determine if it was used on time
		if (window.data[0].action.id === this.data.actions.DEVILMENT.id /* ||
			this.technicalFinishIds.includes(lastWindow.rotation[lastWindow.rotation.length-1].action)*/) {
			return true
		}

		return false
	}

	private getNotesIcon(rulePassed: boolean | undefined) {
		if (rulePassed == null) {
			return <Icon name={'minus'} className={'text-warning'} />
		}
		return <Icon
			name={rulePassed ? 'checkmark' : 'remove'}
			className={rulePassed ? 'text-success' : 'text-error'}
		/>
	}
}
