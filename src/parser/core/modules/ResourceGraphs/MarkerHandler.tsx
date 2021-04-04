import React, {MouseEventHandler, ReactNode, useCallback, useState} from 'react'
import {createPortal} from 'react-dom'
import {ResourceDatum, ResourceMeta} from './ResourceGraphs'
import styles from './ResourceGraphs.module.css'

export type ResourceInfo =
	& ResourceMeta
	& Partial<ResourceDatum>

export interface MarkerHandlerProps {
	getResources: (fightPercent: number) => ResourceInfo[]
}

interface MarkerPositionData {
	cursorLeft: number
	itemTop: number
	itemLeft: number
}

interface MarkerState extends MarkerPositionData {
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
			{markerState != null && (
				<Marker {...markerState}>
					<ul className={styles.resourceList}>
						{markerState.resources.map((resource, index) => (
							<li key={index} className={styles.resourceItem}>
								<span
									className={styles.resourceSwatch}
									style={{background: resource.colour.toString()}}
								/>
								{resource.label}: {resource.current ?? 'Unknown'} / {resource.maximum ?? 'Unknown'}
							</li>
						))}
					</ul>
				</Marker>
			)}
		</div>
	)
}

interface MarkerProps extends MarkerPositionData {
	children?: ReactNode
}

const Marker = ({
	children,
	cursorLeft,
	itemTop,
	itemLeft,
}: MarkerProps) => <>
	<div
		className={styles.markerLine}
		style={{left: cursorLeft - itemLeft}}
	/>
	{createPortal(
		<div
			className={styles.markerTooltip}
			style={{
				top: itemTop,
				left: cursorLeft,
			}}
		>
			{children}
		</div>,
		document.body,
	)}
</>
