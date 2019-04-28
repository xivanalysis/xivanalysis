import {Item} from './Item'

export class Group {
	name: string
	items: Item[]

	constructor(opts: {
		name: string,
		items?: Item[],
	}) {
		this.name = opts.name
		this.items = opts.items || []
	}
}
