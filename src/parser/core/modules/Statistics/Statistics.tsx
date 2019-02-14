import Module, {DISPLAY_MODE} from 'parser/core/Module'
import React from 'react'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import {SimpleStatistic} from './SimpleStatistic'
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
const testStatistics: Statistic[] = [new SimpleStatistic({
	title: 'Estimated GCD',
	icon: 'https://xivapi.com/i/000000/000101.png',
	value: 2.46,
	info: <>welp</>,
})]

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
