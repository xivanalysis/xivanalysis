import {msg} from '@lingui/core/macro'
import {Analyser, DisplayMode} from 'parser/core/Analyser'
import {ComponentType} from 'react'
import {DISPLAY_ORDER} from '../DISPLAY_ORDER'
import {StatisticComponent} from './StatisticComponent'
import styles from './Statistics.module.css'

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
export type ColumnSpan = 1 | 2 | 3 | 4

export interface Statistic {
	Content: ComponentType
	Info?: ComponentType
	width?: ColumnSpan
	height?: number
	statsDisplayOrder?: number
}

export class Statistics extends Analyser {
	static override handle = 'statistics'
	static override title = msg({id: 'core.statistics.title', message: 'Statistics'})
	static override displayOrder = DISPLAY_ORDER.STATISTICS
	static override displayMode = DisplayMode.RAW

	private statistics: Statistic[] = []

	add(statistic: Statistic) {
		this.statistics.push(statistic)
	}

	override output() {
		if (!this.statistics.length) {
			return false
		}
		this.statistics.sort((a, b) => (a.statsDisplayOrder ?? 0) - (b.statsDisplayOrder ?? 0))

		return (
			<div className={styles.statistics}>
				{this.statistics.map((statistic, i) => (
					<StatisticComponent key={i} statistic={statistic}/>
				))}
			</div>
		)
	}
}
