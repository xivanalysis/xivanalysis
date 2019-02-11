import classNames from 'classnames'
import Module, {DISPLAY_MODE} from 'parser/core/Module'
import React from 'react'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import styles from './Statistics.module.css'

export class Statistics extends Module {
	static handle = 'statistics'
	static displayOrder = DISPLAY_ORDER.STATISTICS
	static displayMode = DISPLAY_MODE.RAW

	output() {
		return (
			<div className={styles.statistics}>
				<div className={styles.statistic}>
					<img src="https://xivapi.com/i/000000/000101.png" className={styles.icon}/>
					Estimated GCD
					<div className={styles.bigNumberThing}>2.46s</div>
				</div>
				<div className={classNames(styles.statistic, styles.span2)}/>
				<div className={styles.statistic}/>
				<div className={classNames(styles.statistic, styles.span2)}/>
				<div className={styles.statistic} style={{gridRowEnd: 'span 2'}}/>
				<div className={styles.statistic}/>
				<div className={styles.statistic}/>
				<div className={classNames(styles.statistic, styles.span3)}/>
				<div className={styles.statistic}/>
			</div>
		)
	}
}
