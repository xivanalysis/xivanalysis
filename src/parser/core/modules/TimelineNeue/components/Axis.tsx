import {timeMinute, timeSecond} from 'd3-time'
import {utcFormat} from 'd3-time-format'
import React, {memo} from 'react'
import {Item} from './Base'
import styles from './Component.module.css'
import {Row} from './Row'
import {useScale} from './ScaleHandler'

const EXPAND_TICK_DOMAIN_BY = 0.05 // 5%

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
			<Item key={index} time={tick} disableCulling>
				<div className={styles.gridLine}/>
			</Item>
		))}
		<Row>
			{ticks.map((tick, index) => (
				<Item key={index} time={tick} disableCulling>
					{formatTick(tick)}
				</Item>
			))}
		</Row>
	</>
})

const formatTick = (date: Date) => (
	timeSecond(date) < date ? utcFormat('.%L') :
	timeMinute(date) < date ? utcFormat('%-S') :
	utcFormat('%-Mm')
)(date)
