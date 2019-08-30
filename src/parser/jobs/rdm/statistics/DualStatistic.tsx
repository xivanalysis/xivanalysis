import {AbstractStatistic, AbstractStatisticOptions} from 'parser/core/modules/Statistics/AbstractStatistic'
import React from 'react'
import styles from './DualStatistic.module.css'

export class DualStatistic extends AbstractStatistic {
	private label: React.ReactNode
	private title: React.ReactNode
	private title2: React.ReactNode
	private icon?: string
	private icon2?: string
	private value: React.ReactNode
	private value2: React.ReactNode

	constructor(opts: {
		label: React.ReactNode,
		title: React.ReactNode,
		title2: React.ReactNode,
		icon?: string,
		icon2?: string,
		value: React.ReactNode,
		value2: React.ReactNode,
	} & AbstractStatisticOptions) {
	// 	super({
	// 		...opts,
	// 		width: opts.width || 0 < 2? 2 : opts.width,
	// })
		super(opts)

		this.label = opts.label
		this.title = opts.title
		this.title2 = opts.title2
		this.icon = opts.icon
		this.icon2 = opts.icon2
		this.value = opts.value
		this.value2 = opts.value2
	}

	Content = () => (
		<div className={styles.dualStatistic}>
			{this.label}
			<div className={styles.titleWrapper}>
				{this.icon && <img src={this.icon} className={styles.icon}/>}
				<div className={styles.title}>{this.title}</div>
				<div className={styles.value}>{this.value}</div>
			</div>
			<div className={styles.titleWrapper}>
				{this.icon && <img src={this.icon2} className={styles.icon}/>}
				<div className={styles.title}>{this.title2}</div>
				<div className={styles.value}>{this.value2}</div>
			</div>
		</div>
	)
}
