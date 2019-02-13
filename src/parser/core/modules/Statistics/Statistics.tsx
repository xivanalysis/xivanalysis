import classNames from 'classnames'
import Module, {DISPLAY_MODE} from 'parser/core/Module'
import React from 'react'
import {Icon} from 'semantic-ui-react'
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
					<div className={styles.title}>
						<img src="https://xivapi.com/i/000000/000101.png" className={styles.icon}/>
						<div>Estimated GCD words words words words words words words words words words words words words words words words words words words</div>
					</div>

					<div className={styles.bigNumberThing}>2.46s</div>

					<div className={styles.info}>
						<Icon name="info" className={styles.fuckSemantic}/>
					</div>
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
