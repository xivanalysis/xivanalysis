import {Trans} from '@lingui/react'
import {
	column,
	Data,
	TooltipDetail,
	TooltipProps as BaseTooltipProps,
	TooltipProvider,
	useGameData,
} from '@xivanalysis/tooltips'
import {useDataContext} from 'components/DataContext'
import {ActionKey, ITEM_ID_OFFSET} from 'data/ACTIONS'
import {Language} from 'data/LANGUAGES'
import {StatusKey, STATUS_ID_OFFSET} from 'data/STATUSES'
import {useObserver} from 'mobx-react'
import React, {CSSProperties, memo, ReactNode, useContext, useState} from 'react'
import {createPortal} from 'react-dom'
import {Manager, Popper, Reference} from 'react-popper'
import {Icon} from 'semantic-ui-react'
import {StoreContext} from 'store'
import {BackfillUnion} from 'utilities'
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
	@column('Icon', {type: 'icon'}) icon!: string
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
type TooltipHelperProps = Omit<TooltipProps, 'sheet'>

export type DataLinkProps =
	& TooltipHelperProps
	& BackfillUnion<
		| {action: ActionKey}
		| {status: StatusKey}
		| {item: ActionKey}
	>

export function DataLink(props: DataLinkProps) {
	if (props.action != null) {
		return <ActionLink {...props}/>
	}

	if (props.status != null) {
		return <StatusLink {...props}/>
	}

	if (props.item != null) {
		return <ItemLink {...props}/>
	}

	throw new Error('Invalid DataLink props')
}

export type ActionLinkProps =
	& TooltipHelperProps
	& {action?: ActionKey}

export function ActionLink({action, ...props}: ActionLinkProps) {
	const {actions} = useDataContext()
	const actionData = action && actions[action]
	return (
		<Tooltip
			{...actionData}
			{...props}
			sheet="Action"
		/>
	)
}

export type StatusLinkProps =
	& TooltipHelperProps
	& {status?: StatusKey}

export function StatusLink({status, ...props}: StatusLinkProps) {
	const {statuses} = useDataContext()
	const statusData = status && statuses[status]
	const data = {...statusData, ...props}
	return  (
		<Tooltip
			{...data}
			sheet="Status"
			id={data.id && (data.id > STATUS_ID_OFFSET ? data.id - STATUS_ID_OFFSET : data.id)}
		/>
	)
}

// Items are currently mushed in with actions.
export type ItemLinkProps =
	& TooltipHelperProps
	& {item?: ActionKey}

export function ItemLink({item, ...props}: ItemLinkProps) {
	const {actions} = useDataContext()
	const itemData = item && actions[item]
	const data = {...itemData, ...props}
	return (
		<Tooltip
			{...data}
			sheet="Item"
			id={data.id && data.id - ITEM_ID_OFFSET}
		/>
	)
}

/** @deprecated */
export default Tooltip
