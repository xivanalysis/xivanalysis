import {ReactNode} from 'react'
import {AbstractStatistic, AbstractStatisticOptions} from './AbstractStatistic'
import styles from './SimpleStatistic.module.css'

export class SimpleStatistic extends AbstractStatistic {
	private title: ReactNode
	private icon?: string
	private value: ReactNode

	constructor(opts: {
		title: ReactNode,
		icon?: string,
		value: ReactNode,
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
