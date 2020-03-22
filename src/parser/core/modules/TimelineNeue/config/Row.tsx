import {ReactNode} from 'react'
import {Item} from './Item'

export interface Row {
	readonly label?: ReactNode
	readonly height?: number
	readonly order?: number
	readonly rows: Row[]
	readonly items: Item[]
}

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

	addRow<T extends Row>(row: T): T {
		this.rows.push(row)
		return row
	}

	addItem<T extends Item>(item: T): T {
		this.items.push(item)
		return item
	}
}
