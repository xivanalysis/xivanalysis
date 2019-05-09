import classNames from 'classnames'
import React from 'react'
import {Icon, Popup} from 'semantic-ui-react'
import {ColumnSpan, Statistic} from './Statistics'
import styles from './Statistics.module.css'

const spanClassMap: Record<ColumnSpan, keyof typeof styles> = {
	1: 'span1',
	2: 'span2',
	3: 'span3',
	4: 'span4',
}

interface Props {
	statistic: Statistic
}

export class StatisticComponent extends React.PureComponent<Props> {
	render() {
		const {statistic} = this.props
		const colSpanClass = spanClassMap[statistic.width || 1]

		const content = (
			<div
				className={classNames(
					styles.statistic,
					styles[colSpanClass],
				)}
				style={{gridRowEnd: `span ${statistic.height || 1}`}}
			>
				<statistic.Content/>

				{statistic.Info && (
					<div className={styles.info}>
						<Icon name="info" className={styles.infoIcon}/>
					</div>
				)}
			</div>
		)

		if (!statistic.Info) {
			return content
		}

		return <Popup
			trigger={content}
			content={<statistic.Info/>}
			position="bottom center"
			wide="very"
		/>
	}
}
