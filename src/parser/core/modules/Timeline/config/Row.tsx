import React, {ComponentType, ReactNode} from 'react'
import {Item} from './Item'

export interface TooltipContentProps { timestamp: number }
export type TooltipContent = ComponentType<TooltipContentProps>

export interface Row {
	/** Label to display for the row */
	readonly label?: ReactNode
	/** Minimum height of the row */
	readonly height?: number
	/** Override insertion order of row. Smaller numbers appear first. */
	readonly order?: number
	/** If true, the row will default to a collapsed state. Default `false`. */
	readonly collapse?: boolean
	/** If true, and the row starts collapsed, the row will not allow exiting from the collapsed state. Default `false`. */
	readonly forceCollapsed?: boolean
	/** If true, items and rows within this row are hidden when the parent is collapsed. Default `false`. */
	readonly hideCollapsed?: boolean
	/** Child rows of this row */
	readonly rows: Row[]
	/** Items within this row */
	readonly items: Item[]

	// fsdafasdfa
	readonly TooltipContent?: TooltipContent
}

/** Simple row that can be added to the timeline */
export class SimpleRow implements Row {
	label?: ReactNode
	height?: number
	readonly order?: number
	collapse?: boolean
	forceCollapsed?: boolean
	hideCollapsed?: boolean
	rows: Row[]
	items: Item[]

	private _TooltipContent?: TooltipContent

	constructor(opts: {
		label?: ReactNode,
		height?: number
		order?: number
		collapse?: boolean
		forceCollapsed?: boolean
		hideCollapsed?: boolean
		rows?: readonly Row[],
		items?: readonly Item[],
		TooltipContent?: TooltipContent
	} = {}) {
		this.label = opts.label
		this.height = opts.height
		this.order = opts.order
		this.collapse = opts.collapse
		this.forceCollapsed = opts.forceCollapsed
		this.hideCollapsed = opts.hideCollapsed
		this.rows = opts.rows?.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) ?? []
		this.items = opts.items?.slice() ?? []
		this._TooltipContent = opts.TooltipContent
	}

	// TODO all of this shit
	readonly TooltipContent = (props: TooltipContentProps) => <>
		{this._TooltipContent && <this._TooltipContent timestamp={props.timestamp}/>}

		{this.rows.map((row, index) => <>
			{row.TooltipContent && (
				<row.TooltipContent key={index} timestamp={props.timestamp}/>
			)}
		</>
		)}
	</>

	/** Add a row as a child to this row */
	addRow<T extends Row>(row: T): T {
		const newOrder = row.order ?? 0
		const index = this.rows
			.findIndex(existingRow => newOrder < (existingRow.order ?? 0))

		if (index === -1) {
			this.rows.push(row)
		} else {
			this.rows.splice(index, 0, row)
		}

		return row
	}

	/** Add an item to this row */
	addItem<T extends Item>(item: T): T {
		this.items.push(item)
		return item
	}
}

/** Row that will contain all items added within a dedicated track (opposed to default spanning behaviour) */
export class ContainerRow extends SimpleRow {
	private containerRow?: SimpleRow

	override addRow<T extends Row>(row: T): T {
		// If there's items on the main row, we need to move them onto the container now there's a subrow
		if (this.items.length > 0) {
			this.buildContainer()
		}

		return super.addRow(row)
	}

	override addItem<T extends Item>(item: T): T {
		// If we don't have a container, but there's already subrows, we need to build one
		if (this.containerRow == null && this.rows.length > 0) {
			this.buildContainer()
		}

		return this.containerRow == null
			? super.addItem(item)
			: this.containerRow.addItem(item)
	}

	private buildContainer() {
		// We may be building the container after items are already added to the parent - copy across
		this.containerRow = super.addRow(new SimpleRow({
			order: -Infinity,
			items: this.items,
		}))
		this.items = []
	}
}
