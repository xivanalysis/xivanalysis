import {NumberFormat, Trans} from '@lingui/react'
import React, {MouseEventHandler, ReactNode, useCallback, useState} from 'react'
import {createPortal} from 'react-dom'
import {ResourceDatum, ResourceMeta} from './ResourceGraphs'
import styles from './ResourceGraphs.module.css'

export type ResourceInfo =
	& ResourceMeta
	& Partial<ResourceDatum>

export interface MarkerHandlerProps {
	handle: string,
	getData: (fightPercent: number, handle: string) => ResourceInfo[]
}

interface MarkerPositionData {
	cursorLeft: number
	itemTop: number
	itemLeft: number
}

interface MarkerState extends MarkerPositionData {
	resources: ResourceInfo[]
}

export function MarkerHandler(props: MarkerHandlerProps) {
	const {handle, getData} = props
	const [markerState, setMarkerState] = useState<MarkerState>()

	const onMouseMove: MouseEventHandler<HTMLDivElement> = useCallback(event => {
		// TODO: See if can reduce gBCR usage, it's not a cheap call.
		const rect = event.currentTarget.getBoundingClientRect()

		const fightPercent = (event.clientX - rect.left) / rect.width

		const resources = getData(fightPercent, handle)

		setMarkerState({
			cursorLeft: event.clientX,
			itemTop: rect.top,
			itemLeft: rect.left,
			resources,
		})
	}, [handle, getData])

	const onMouseLeave = useCallback(() => {
		setMarkerState(undefined)
	}, [])

	return (
		<div
			className={styles.markerContainer}
			onMouseMove={onMouseMove}
			onMouseLeave={onMouseLeave}
		>
			{(markerState != null && markerState.resources.length > 0) && (
				<Marker {...markerState}>
					<ul className={styles.resourceList}>
						{markerState.resources.sort((a, b) => (b.base ?? 0) - (a.base ?? 0)).map(({label, current = 0, maximum = 0, colour, tooltipHideMaximum}, index) => (
							<li key={index} className={styles.resourceItem}>
								<span
									className={styles.resourceSwatch}
									style={{background: colour.toString()}}
								/>
								{
									tooltipHideMaximum
										? <Trans id="core.resource-graphs.resource-current">
											{label}:
											<NumberFormat value={current}/>
										</Trans>
										: <Trans id="core.resource-graphs.resource-value">
											{label}:
											<NumberFormat value={current}/> /
											<NumberFormat value={maximum}/>
										</Trans>
								}
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
