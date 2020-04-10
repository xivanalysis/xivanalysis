import classNames from 'classnames'
import {timeMinute} from 'd3-time'
import {utcFormat} from 'd3-time-format'
import React, {Fragment, memo} from 'react'
import {Item} from './Item'
import {useScale} from './ScaleHandler'
import styles from './Timeline.module.css'

const EXPAND_TICK_DOMAIN_BY = 0.05 // 5%
const AXIS_ROW_HEIGHT = 50

export interface AxisProps {
	height: number
}

export const Axis = memo(function Axis({
	height,
}: AxisProps) {
	const scale = useScale()

	// Extend the domain slightly so ticks don't disappear the moment they hit the edge
	const extendedScale = scale.copy()
	const [dMin, dMax] = extendedScale.domain().map(date => date.getTime())
	const expandBy = (dMax - dMin) * EXPAND_TICK_DOMAIN_BY
	extendedScale.domain([dMin - expandBy, dMax + expandBy])

	const ticks = extendedScale.ticks()

	// Calculate values used for the "sticky" first major tick
	const viewMin = scale.domain()[0]
	const stickyTick = timeMinute(viewMin)
	const stickyTickEnd = timeMinute.offset(stickyTick, 1)

	// Pre-calculate scaled tick locations
	const lefts = ticks.map(tick => scale(tick))

	return <>
		{/* Grid lines */}
		<div
			className={styles.track}
			style={{
				gridRowStart: 1,
				gridRowEnd: `span ${height + 1}`,
			}}
		>
			{ticks.map((tick, index) => (
				<Item key={index} left={lefts[index]}>
					<div className={classNames(
						styles.gridLine,
						isMajorTick(tick) && styles.major,
					)}/>
				</Item>
			))}
		</div>

		{/* Numeric ticks */}
		<div
			className={styles.track}
			style={{
				gridRowStart: height + 1,
				gridRowEnd: 'span 1',
				height: AXIS_ROW_HEIGHT,
			}}
		>
			{ticks.map((tick, index) => <Fragment key={index}>
				<Item left={lefts[index]}>
					{/* Second ticks */}
					<div className={styles.axisTick}>
						{formatSeconds(tick)}
					</div>

					{/* Minute ticks. Skip ticks before stickyTickEnd to prevent dupes. */}
					{isMajorTick(tick) && (tick >= stickyTickEnd) && (
						<div className={classNames(styles.axisTick, styles.major)}>
							{formatMinutes(tick)}
						</div>
					)}
				</Item>
			</Fragment>)}

			{/* "Sticky" minute tick */}
			<Item left={scale(viewMin)} right={scale(stickyTickEnd)}>
				<div className={classNames(styles.axisTick, styles.major, styles.first)}>
					{formatMinutes(stickyTick)}
				</div>
			</Item>
		</div>
	</>
})

// Major ticks are minute lines
const isMajorTick = (date: Date) =>
	Number(timeMinute(date)) === Number(date)

const formatSeconds = utcFormat('%-S')
const formatMinutes = utcFormat('%-Mm')
