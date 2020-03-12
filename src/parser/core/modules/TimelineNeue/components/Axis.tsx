import {timeMinute, timeSecond} from 'd3-time'
import {utcFormat} from 'd3-time-format'
import React, {memo} from 'react'
import {Item, Row} from './Base'
import styles from './Component.module.css'
import {useScale} from './ScaleHandler'

export const Axis = memo(function Axis() {
	const scale = useScale()
	const ticks = scale.ticks()

	// Grid lines will expand to the height of the container,
	// formatted tick labels are constrained to a row
	return <>
		{ticks.map((tick, index) => (
			<Item key={index} time={tick}>
				<div className={styles.gridLine}/>
			</Item>
		))}
		<Row>
			{ticks.map((tick, index) => (
				<Item key={index} time={tick}>
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
