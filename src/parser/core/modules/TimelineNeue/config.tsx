import React, {ComponentType, ReactNode} from 'react'

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

export interface Item {
	readonly start: number
	readonly end?: number
	readonly Content: ComponentType
}

export class SimpleItem implements Item {
	readonly start: number
	readonly end?: number
	private readonly content: ReactNode

	constructor(opts: {
		start: number
		end?: number
		content?: ReactNode,
	} ) {
		this.start = opts.start
		this.end = opts.end
		this.content = opts.content
	}

	Content = () => <>{this.content}</>
}
