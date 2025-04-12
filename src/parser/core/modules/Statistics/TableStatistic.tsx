import {ReactNode} from 'react'
import {AbstractStatistic, AbstractStatisticOptions} from './AbstractStatistic'
import styles from './TableStatistic.module.css'

interface FixedLengthArray<T, L extends number> extends ReadonlyArray<T> {
	0: T
	length: L
}

export type Rows<T, L extends number> = Array<FixedLengthArray<T, L>>

export class TableStatistic<L extends number> extends AbstractStatistic {
	private readonly headings: FixedLengthArray<ReactNode, L>
	private readonly rows: Rows<ReactNode, L>

	constructor(opts: {
		headings: FixedLengthArray<ReactNode, L>,
		rows: Rows<ReactNode, L>,
	} & AbstractStatisticOptions) {
		super(opts)

		this.headings = opts.headings
		this.rows = opts.rows
	}

	Content = () => <div className={styles.container}>
		<table className={styles.table}>
			<thead>
				<tr>
					{this.headings.map((heading, index) => (
						<th key={index}>{heading}</th>
					))}
				</tr>
			</thead>
			<tbody>
				{this.rows.map((row, index) => (
					<tr key={index}>
						{row.map((col, index) => (
							<td key={index}>{col}</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	</div>
}
