import {merge} from 'lodash'
import {Component, ReactNode} from 'react'
import {ChartComponentProps, Pie} from 'react-chartjs-2'
import * as styles from './PieChartWithLegend.module.css'

interface DataPoint {
	value: number,
	label: string,
	backgroundColor?: string,
	additional?: ReactNode[],
}

type Props = ChartComponentProps & {
	headers?: {
		label?: ReactNode,
		additional?: ReactNode[],
	},
	data: DataPoint[],
}

const MISSING_COLOUR_FALLBACK = '#888'

export class PieChartWithLegend extends Component<Props> {
	override render() {
		const {
			data: propData,
			headers,
		} = this.props

		const backgrounds = propData.map(d => d.backgroundColor || MISSING_COLOUR_FALLBACK)

		const data = {
			labels: propData.map(d => d.label),
			datasets: [{
				data: propData.map(d => d.value),
				backgroundColor: backgrounds,
			}],
		}

		const options = merge({
			responsive: false,
			legend: {display: false},
			tooltips: {enabled: false},
		}, this.props.options)

		return <>
			<div className={styles.chartWrapper}>
				<Pie
					width={100}
					height={100}
					{...this.props}
					data={data}
					options={options}
				/>
			</div>
			<table className={styles.table}>
				{headers && <thead>
					<tr>
						<th></th>
						<th>{headers.label || 'Label'}</th>
						{headers.additional && headers.additional.map(
							(val, index) => <th key={index}>{val}</th>,
						)}
					</tr>
				</thead>}
				<tbody>
					{propData.map((val, index) => {
						return <tr key={index}>
							<td>
								<span
									className={styles.swatch}
									style={{backgroundColor: backgrounds[index]}}
								/>
							</td>
							<td>{val.label}</td>
							{val.additional && val.additional.map(
								(val, index) => <td key={index}>{val}</td>,
							)}
						</tr>
					})}
				</tbody>
			</table>
		</>
	}
}
