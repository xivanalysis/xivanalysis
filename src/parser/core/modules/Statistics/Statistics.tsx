import classNames from 'classnames'
import Module, {DISPLAY_MODE} from 'parser/core/Module'
import React from 'react'
import {Icon} from 'semantic-ui-react'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import styles from './Statistics.module.css'

// tslint:disable-next-line:no-magic-numbers
type ColumnSpan = 1 | 2 | 3 | 4
const spanClassMap: Record<ColumnSpan, keyof typeof styles> = {
	1: 'span1',
	2: 'span2',
	3: 'span3',
	4: 'span4',
}

export interface Statistic {
	Content: React.ComponentType
	Info?: React.ComponentType
	width?: ColumnSpan
	height?: number
}

// TODO: This shit
const testStatistics: Statistic[] = [{
	Content: () => <>
		<div className={styles.title}>
			<img src="https://xivapi.com/i/000000/000101.png" className={styles.icon}/>
			<div>Estimated GCD words words words words words words words words words words words words words words words words words words words</div>
		</div>
		<div className={styles.bigNumberThing}>2.46s</div>
	</>,
	Info: () => <>welp</>,
}]

export class Statistics extends Module {
	static handle = 'statistics'
	static displayOrder = DISPLAY_ORDER.STATISTICS
	static displayMode = DISPLAY_MODE.RAW

	output() {
		return (
			<div className={styles.statistics}>
				{testStatistics.map((statistic, i) => {
					const colSpanClass = spanClassMap[statistic.width || 1]
					return (
						<div
							key={i}
							className={classNames(
								styles.statistic,
								styles[colSpanClass],
								statistic.Info && styles.hasInfo,
							)}
							style={{gridRowEnd: `span ${statistic.height || 1}`}}
						>
							<div className={styles.content}>
								<statistic.Content/>
							</div>

							{statistic.Info && (
								<div className={styles.info}>
									<Icon name="info" className={styles.infoIcon}/>
								</div>
							)}
						</div>
					)
				})}

				<div className= {classNames(styles.statistic, styles.span2)}/>
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
