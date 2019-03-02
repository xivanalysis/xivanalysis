import React from 'react'
import {AbstractStatistic, AbstractStatisticOptions} from './AbstractStatistic'
import styles from './SimpleStatistic.module.css'

export class SimpleStatistic extends AbstractStatistic {
	private title: React.ReactNode
	private icon?: string
	private value: React.ReactNode

	constructor(opts: {
		title: React.ReactNode,
		icon?: string,
		value: React.ReactNode,
	} & AbstractStatisticOptions) {
		super(opts)

		this.title = opts.title
		this.icon = opts.icon
		this.value = opts.value
	}

	Content = () => (
		<div className={styles.simpleStatistic}>
			<div className={styles.titleWrapper}>
				{this.icon && <img src={this.icon} className={styles.icon}/>}
				<div className={styles.title}>{this.title}</div>
			</div>
			<div className={styles.value}>{this.value}</div>
		</div>
	)
}
