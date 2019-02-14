import Module, {DISPLAY_MODE} from 'parser/core/Module'
import React from 'react'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import {StatisticComponent} from './StatisticComponent'
import styles from './Statistics.module.css'

// tslint:disable-next-line:no-magic-numbers
export type ColumnSpan = 1 | 2 | 3 | 4

export interface Statistic {
	Content: React.ComponentType
	Info?: React.ComponentType
	width?: ColumnSpan
	height?: number
}

// TODO: This shit
const testStatistics: Statistic[] = [{
	Content: () => <>
		<div className={styles.title}>
			<img src="https://xivapi.com/i/000000/000101.png" className={styles.icon}/>
			<div>Estimated GCD</div>
		</div>
		<div className={styles.bigNumberThing}>2.46s</div>
	</>,
	Info: () => <>welp</>,
}]

export class Statistics extends Module {
	static handle = 'statistics'
	static displayOrder = DISPLAY_ORDER.STATISTICS
	static displayMode = DISPLAY_MODE.RAW

	output() {
		return (
			<div className={styles.statistics}>
				{testStatistics.map((statistic, i) => (
					<StatisticComponent key={i} statistic={statistic}/>
				))}
			</div>
		)
	}
}
