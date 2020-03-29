import {ReactNode} from 'react'
import {Item} from './Item'

export interface Row {
	/** Label to display for the row */
	readonly label?: ReactNode
	/** Minimum height of the row */
	readonly height?: number
	/** Override insertion order of row. Smaller numbers appear first. */
	readonly order?: number
	/** Child rows of this row */
	readonly rows: Row[]
	/** Items within this row */
	readonly items: Item[]
}

/** Simple row that can be added to the timeline */
export class SimpleRow implements Row {
	label?: ReactNode
	height?: number
	order?: number
	rows: Row[]
	items: Item[]

	constructor(opts: {
		label?: ReactNode,
		height?: number
		order?: number
		rows?: readonly Row[],
		items?: readonly Item[],
	} = {}) {
		this.label = opts.label
		this.height = opts.height
		this.order = opts.order
		this.rows = opts.rows?.slice() ?? []
		this.items = opts.items?.slice() ?? []
	}

	/** Add a row as a child to this row */
	addRow<T extends Row>(row: T): T {
		this.rows.push(row)
		return row
	}

	/** Add an item to this row */
	addItem<T extends Item>(item: T): T {
		this.items.push(item)
		return item
	}
}
