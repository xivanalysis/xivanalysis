import React, {MouseEventHandler, ReactNode, useCallback, useState} from 'react'
import {createPortal} from 'react-dom'
import styles from './ResourceGraphs.module.css'

export interface ResourceInfo {
	label: ReactNode,
	value?: number
}

export interface MarkerHandlerProps {
	getResources: (fightPercent: number) => ResourceInfo[]
}

interface MarkerState {
	cursorLeft: number
	itemTop: number
	itemLeft: number
	resources: ResourceInfo[]
}

export function MarkerHandler({getResources}: MarkerHandlerProps) {
	const [markerState, setMarkerState] = useState<MarkerState>()

	const onMouseMove: MouseEventHandler<HTMLDivElement> = useCallback(event => {
		// TODO: See if can reduce gBCR usage, it's not a cheap call.
		const rect = event.currentTarget.getBoundingClientRect()

		const resources = getResources((event.clientX - rect.left) / rect.width)

		setMarkerState({
			cursorLeft: event.clientX,
			itemTop: rect.top,
			itemLeft: rect.left,
			resources,
		})
	}, [getResources])

	const onMouseLeave = useCallback(() => {
		setMarkerState(undefined)
	}, [])

	return (
		<div
			className={styles.markerContainer}
			onMouseMove={onMouseMove}
			onMouseLeave={onMouseLeave}
		>
			<div
				className={styles.markerLine}
				style={{
					left: markerState && (markerState.cursorLeft - markerState.itemLeft), // todo: yuck
					opacity: markerState == null ? 0 : 1,
				}}
			/>
			{createPortal(
				<ul
					className={styles.markerTooltip}
					style={{
						top: markerState?.itemTop,
						left: markerState?.cursorLeft,
					}}
				>
					{markerState?.resources.map((resource, index) => (
						<li key={index}>{resource.label}: {resource.value}</li>
					))}
				</ul>,
				document.body,
			)}
		</div>
	)
}
