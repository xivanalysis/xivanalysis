import classNames from 'classnames'
import {timeMinute} from 'd3-time'
import {utcFormat} from 'd3-time-format'
import React, {memo} from 'react'
import {Item} from './Item'
import {Row} from './Row'
import {useScale} from './ScaleHandler'
import styles from './Timeline.module.css'

const EXPAND_TICK_DOMAIN_BY = 0.05 // 5%
const AXIS_ROW_HEIGHT = 50

export const Axis = memo(function Axis() {
	const scale = useScale()

	// Extend the domain slightly so ticks don't disappear the moment they hit the edge
	const extendedScale = scale.copy()
	const [dMin, dMax] = extendedScale.domain().map(date => date.getTime())
	const expandBy = (dMax - dMin) * EXPAND_TICK_DOMAIN_BY
	extendedScale.domain([dMin - expandBy, dMax + expandBy])

	const ticks = extendedScale.ticks()

	// Grid lines will expand to the height of the container,
	// formatted tick labels are constrained to a row
	// We're disabling culling here, as the scale's axis does it for us.
	return <>
		{ticks.map((tick, index) => (
			<Item key={index} start={tick} disableCulling>
				<div className={classNames(
					styles.gridLine,
					isMajorTick(tick) && styles.major,
				)}/>
			</Item>
		))}
		<Row height={AXIS_ROW_HEIGHT}>
			{ticks.map((tick, index) => (
				<Item key={index} start={tick} disableCulling>
					<div className={styles.axisTick}>
						{formatSeconds(tick)}
						{isMajorTick(tick) && <>
							<br/>{formatMinutes(tick)}
						</>}
					</div>
				</Item>
			))}
		</Row>
	</>
})

// Major ticks are minute lines
const isMajorTick = (date: Date) =>
	Number(timeMinute(date)) === Number(date)

const formatSeconds = utcFormat('%-S')
const formatMinutes = utcFormat('%-Mm')
