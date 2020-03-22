import React, {ComponentType, ReactNode} from 'react'

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
