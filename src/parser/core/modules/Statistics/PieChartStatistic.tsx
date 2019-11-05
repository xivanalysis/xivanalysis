import {merge} from 'lodash'
import React from 'react'
import {Pie} from 'react-chartjs-2'
import {AbstractStatistic, AbstractStatisticOptions} from './AbstractStatistic'
import styles from './PieChartStatistic.module.css'

const DEFAULT_PIE_STAT_WIDTH = 2
const CHART_SIZE = 80
const DEFAULT_CHART_OPTIONS = {
	responsive: false,
	legend: {display: false},
	tooltips: {enabled: false},
}
const MISSING_COLOUR_FALLBACK = '#888'

interface FixedLengthArray<T extends any, L extends number> extends ReadonlyArray<T> {
	0: T
	length: L
}

type DataSet<T> = ReadonlyArray<DataPoint<T>>

interface DataPoint<T> {
	value: number
	color?: string,
	columns: T
}

export class PieChartStatistic<L extends number> extends AbstractStatistic {
	private readonly headings: FixedLengthArray<React.ReactNode, L>
	private readonly data: DataSet<FixedLengthArray<React.ReactNode, L>>
	private readonly options: Chart.ChartOptions

	constructor(opts: {
		headings: FixedLengthArray<React.ReactNode, L>,
		data: DataSet<FixedLengthArray<React.ReactNode, L>>,
		options?: Chart.ChartOptions,
	} & AbstractStatisticOptions) {
		super({
			...opts,
			width: opts.width || DEFAULT_PIE_STAT_WIDTH,
		})

		this.headings = opts.headings
		this.data = opts.data
		this.options = merge(DEFAULT_CHART_OPTIONS, opts.options)
	}

	private get chartData() {
		const dataset = this.data.reduce(
			(carry, point) => {
				carry.data.push(point.value)
				carry.backgroundColor.push(point.color || MISSING_COLOUR_FALLBACK)
				return carry
			},
			{data: [], backgroundColor: []} as {data: number[], backgroundColor: string[]},
		)
		return {
			datasets: [dataset],
		}
	}

	Content = () => <>
		<div className={styles.chartWrapper}>
			<Pie
				width={CHART_SIZE}
				height={CHART_SIZE}
				data={this.chartData}
				options={this.options}
			/>
		</div>
		<table className={styles.legend}>
			<thead>
				<tr>
					<th></th>
					{this.headings.map((heading, index) => (
						<th key={index}>{heading}</th>
					))}
				</tr>
			</thead>
			<tbody>
				{this.data.map((point, index) => (
					<tr key={index}>
						<td>
							<span
								className={styles.swatch}
								style={{backgroundColor: point.color || MISSING_COLOUR_FALLBACK}}
							/>
						</td>
						{point.columns.map((value, index) => (
							<td key={index}>{value}</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	</>
}
