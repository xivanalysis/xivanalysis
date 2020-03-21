import {ReactNode} from 'react'

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
}

export interface Item {
	readonly start: number
	readonly end?: number
	readonly content: ReactNode
}

export class SimpleItem implements Item {
	start: number
	end?: number
	content: ReactNode

	constructor(opts: {
		start: number
		end?: number
		content?: ReactNode,
	} ) {
		this.start = opts.start
		this.end = opts.end
		this.content = opts.content
	}
}
