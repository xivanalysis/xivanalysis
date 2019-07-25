import {AbstractStatistic, AbstractStatisticOptions} from 'parser/core/modules/Statistics/AbstractStatistic'
import React from 'react'
import styles from './SectStatistic.module.css'

export default class SectStatstic extends AbstractStatistic {
	private icon?: string
	private value: React.ReactNode

	constructor(opts: {
		icon?: string,
		value: React.ReactNode,
	} & AbstractStatisticOptions) {
		super(opts)

		this.icon = opts.icon
		this.value = opts.value
	}

	Content = () => (
		<div className={styles.simpleStatistic}>
			<div className={styles.wrapper}>
				{this.icon && <img src={this.icon} className={styles.icon}/>}
				<div className={styles.value}>{this.value}</div>
			</div>
		</div>
	)
}
