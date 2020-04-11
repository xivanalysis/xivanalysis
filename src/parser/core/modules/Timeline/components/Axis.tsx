import classNames from 'classnames'
import {timeMinute} from 'd3-time'
import {utcFormat} from 'd3-time-format'
import React, {Fragment, memo} from 'react'
import {Item} from './Item'
import {useScales} from './ScaleHandler'
import styles from './Timeline.module.css'

const AXIS_ROW_HEIGHT = 50

export interface AxisProps {
	height: number
}

export const Axis = memo(function Axis({
	height,
}: AxisProps) {
	const scales = useScales()

	// Extend the domain slightly so ticks don't disappear the moment they hit the edge
	const ticks = scales.extended.ticks()

	// Calculate values used for the "sticky" first major tick
	const viewMin = scales.primary.domain()[0]
	const stickyTick = timeMinute(viewMin)
	const stickyTickEnd = timeMinute.offset(stickyTick, 1)

	// Pre-calculate scaled tick locations
	const lefts = ticks.map(tick => scales.primary(tick))

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
			<Item left={scales.primary(viewMin)} right={scales.primary(stickyTickEnd)}>
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
