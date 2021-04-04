import React, {MouseEventHandler, ReactNode, useCallback, useState} from 'react'
import {createPortal} from 'react-dom'

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
			style={{
				position: 'relative',
				width: '100%',
				height: '100%',
				backgroundColor: 'rgba(255, 0, 0, 0.2)',
			}}
			onMouseMove={onMouseMove}
			onMouseLeave={onMouseLeave}
		>
			<div
				style={{
					position: 'absolute',
					left: markerState && (markerState.cursorLeft - markerState.itemLeft), // todo: yuck
					opacity: markerState == null ? 0 : 1,
					width: 1,
					height: '100%',
					background: 'black',
					pointerEvents: 'none',
				}}
			/>
			{createPortal(
				<div style={{
					position: 'fixed',
					top: markerState?.itemTop,
					left: markerState?.cursorLeft,
					transform: 'translate(-50%, -100%)',
				}}>
					<ul>
						{markerState?.resources.map((resource, index) => (
							<li key={index}>{resource.label}: {resource.value}</li>
						))}
					</ul>
				</div>,
				document.body,
			)}
		</div>
	)
}
