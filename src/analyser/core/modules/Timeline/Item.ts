export class Item {
	icon: string
	timestamp: number
	duration: number

	constructor(opts: {
		icon: string,
		timestamp: number,
		duration?: number,
	}) {
		this.icon = opts.icon
		this.timestamp = opts.timestamp
		this.duration = opts.duration || 0
	}
}
