import Entity from './Entity'

export default class Enemy extends Entity {
	info = null

	get name() { return this.info.name }
	get type() { return this.info.type }
	get guid() { return this.info.guid }
	get id()   { return this.info.id }

	constructor(parser, info) {
		super(parser)

		this.info = info
	}
}
