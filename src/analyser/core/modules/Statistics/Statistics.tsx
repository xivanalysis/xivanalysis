import {t} from '@lingui/macro'
import {DisplayOrder} from 'analyser/core/DisplayOrder'
import {DisplayMode, Module} from 'analyser/Module'
import React from 'react'
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

export class Statistics extends Module {
	static handle = 'statistics'
	static title = t('core.statistics.title')`Statistics`
	static displayOrder = DisplayOrder.STATISTICS
	static displayMode = DisplayMode.RAW

	private statistics: Statistic[] = []

	add(statistic: Statistic) {
		this.statistics.push(statistic)
	}

	output() {
		if (!this.statistics.length) {
			return false
		}

		return (
			<div className={styles.statistics}>
				{this.statistics.map((statistic, i) => (
					<StatisticComponent key={i} statistic={statistic}/>
				))}
			</div>
		)
	}
}
