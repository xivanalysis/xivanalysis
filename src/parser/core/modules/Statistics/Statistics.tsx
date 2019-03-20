import {t} from '@lingui/macro'
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

export class Statistics extends Module {
	static handle = 'statistics'
	// tslint:disable-next-line:variable-name
	static title = t('core.statistics.title')`Statistics`
	static displayOrder = DISPLAY_ORDER.STATISTICS
	static displayMode = DISPLAY_MODE.RAW

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
