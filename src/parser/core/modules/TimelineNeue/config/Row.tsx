import {ReactNode} from 'react'
import {Item} from './Item'

export interface Row {
	readonly label?: ReactNode
	readonly height?: number
	readonly rows: Row[]
	readonly items: Item[]
}

export class SimpleRow implements Row {
	label?: ReactNode
	height?: number
	rows: Row[]
	items: Item[]

	constructor(opts: {
		label?: ReactNode,
		height?: number
		rows?: readonly Row[],
		items?: readonly Item[],
	}) {
		this.label = opts.label
		this.height = opts.height
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
