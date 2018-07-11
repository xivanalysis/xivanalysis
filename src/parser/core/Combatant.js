import Entity from "./Entity"

// This is basically a copy of Enemy - XIV doesn't really have as much on Combatants as WoW.
// TODO: Should I just merge all this crap into the Entity handlers and call it a day?
export default class Combatant extends Entity {
	info = null

	get name() { return this.info.name }

	get type() { return this.info.type }

	get guid() { return this.info.guid }

	get id() { return this.info.id }

	constructor(parser, info) {
		super(parser);

		this.info = info;
	}
}
