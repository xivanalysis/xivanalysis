import {Trans} from '@lingui/react'
import {
	column,
	Data,
	TooltipDetail,
	TooltipProps as BaseTooltipProps,
	TooltipProvider,
	useGameData,
} from '@xivanalysis/tooltips'
import {ITEM_ID_OFFSET} from 'data/ACTIONS'
import {Language} from 'data/LANGUAGES'
import {STATUS_ID_OFFSET} from 'data/STATUSES'
import {useObserver} from 'mobx-react'
import React, {CSSProperties, memo, ReactNode, useContext, useState} from 'react'
import {createPortal} from 'react-dom'
import {Manager, Popper, Reference} from 'react-popper'
import {Icon} from 'semantic-ui-react'
import {StoreContext} from 'store'
import styles from './DbLink.module.css'

export interface ProviderProps {
	children?: ReactNode
}

/** Tooltip data provider. Wrapping here to supply i18n language context. */
export function Provider({children}: ProviderProps) {
	const {i18nStore} = useContext(StoreContext)

	const baseUrl = i18nStore.gameLanguage === Language.CHINESE
		? 'https://cafemaker.wakingsands.com'
		: undefined

	return useObserver(() => (
		<TooltipProvider
			language={i18nStore.gameLanguage}
			baseUrl={baseUrl}
		>
			{children}
		</TooltipProvider>
	))
}

export type TooltipProps =
	& Omit<LabelProps, 'id'>
	& {id?: number, showTooltip?: boolean}

export const Tooltip = memo(function Tooltip({
	id,
	sheet,
	showTooltip = true,
	...labelProps
}: TooltipProps) {
	const [hovering, setHovering] = useState(false)

	if (id == null) { return null }

	const label = <Label sheet={sheet} id={id} {...labelProps}/>
	if (!showTooltip) { return label }

	// We're currently using an oooold version of react-popper here (1.3.7), so we're able to re-use the version semantic is pulling in.
	// TODO: Upgrade to react-popper@2 when semantic is nuked.

	return (
		<span
			onMouseEnter={() => setHovering(true)}
			onMouseLeave={() => setHovering(false)}
		>
			<Manager>
				<Reference children={({ref}) => (
					<span ref={ref}>{label}</span>
				)}/>

				{hovering && createPortal(
					<Popper placement="bottom-start" children={({ref, style, scheduleUpdate}) => (
						<div
							ref={ref}
							style={style}
							className={styles.detail}
						>
							<TooltipDetail
								sheet={sheet}
								id={id}
								onUpdate={scheduleUpdate}
							/>
						</div>
					)}/>,
					document.body,
				)}
			</Manager>
		</span>
	)
})

class LabelData extends Data {
	@column('Name') name!: string
	@column('Icon', {type: 'url'}) icon!: string
}

export interface LabelProps extends BaseTooltipProps {
	children?: ReactNode
	name?: string

	showIcon?: boolean
	showName?: boolean
	iconSize?: CSSProperties['height']
}

function Label({
	sheet,
	id,
	children,
	name: providedName,
	showIcon = true,
	showName = true,
	iconSize,
}: LabelProps) {
	const data = useGameData({
		sheet,
		columns: LabelData,
		id,
	})

	const icon = data == null
		? <Icon loading name="circle notch"/>
		: (
			<img
				src={data.icon}
				alt=""
				className={styles.image}
				style={{height: iconSize}}
			/>
		)

	const name: ReactNode = undefined
		?? children
		?? data?.name
		?? providedName
		?? <Trans id="core.dblink.loading">Loading...</Trans>

	return <>
		{showIcon && icon}
		{showName && (
			<a
				// <3 u garland
				href={`http://www.garlandtools.org/db/#${sheet.toLowerCase()}/${id}`}
				target="_blank"
				rel="noopener noreferrer"
				className={styles.link}
			>
				{name}
			</a>
		)}
	</>
}

// Helpers, because akk is incredibly lazy, and _incredibly_ proud of it.
export type TooltipHelperProps = Omit<TooltipProps, 'sheet'>
export const ActionLink = (props: TooltipHelperProps) => <Tooltip {...props} sheet="Action"/>
export const StatusLink = (props: TooltipHelperProps) => (
	<Tooltip
		{...props}
		sheet="Status"
		id={props.id && (props.id > STATUS_ID_OFFSET ? props.id - STATUS_ID_OFFSET : props.id)}
	/>
)
export const ItemLink = (props: TooltipHelperProps) => (
	<Tooltip
		{...props}
		sheet="Item"
		id={props.id && props.id - ITEM_ID_OFFSET}
	/>
)

/** @deprecated */
export default Tooltip
