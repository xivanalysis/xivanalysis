import Entities from './Entities'
import Combatant from '../Combatant'

export default class Combatants extends Entities {
	players = {}

	getEntities() {
		return this.players
	}

	getEntity(actorId) {
		let player = this.players[actorId]

		if (!player) {
			const info = this.parser.report.friendlies.find(player => player.id === actorId)
			if (!info) { return null }
			this.players[actorId] = player = new Combatant(this.parser, info)
		}

		return player
	}

	get selected() {
		// TODO: What if the player hasn't been checked yet?
		return this.players[this.parser.player.id]
	}
}
