import React from 'react'
import {ColumnSpan, Statistic} from './Statistics'
import styles from './Statistics.module.css'

export class SimpleStatistic implements Statistic {
	Info?: React.ComponentType
	width?: ColumnSpan
	height?: number

	private title: React.ReactNode
	private icon?: string
	private value: React.ReactNode

	constructor(opts: {
		title: React.ReactNode,
		icon?: string,
		value: React.ReactNode
		info?: React.ReactNode,
		width?: ColumnSpan,
		height?: number,
	}) {
		this.title = opts.title
		this.icon = opts.icon
		this.value = opts.value
		this.width = opts.width
		this.height = opts.height

		if (opts.info) {
			this.Info = () => <>{opts.info}</>
		}
	}

	Content = () => <>
		<div className={styles.titleWrapper}>
			{this.icon && <img src={this.icon} className={styles.icon}/>}
			<div className={styles.title}>{this.title}</div>
		</div>
		<div className={styles.value}>{this.value}</div>
	</>
}
