import Entities from './Entities'
import Combatant from '../Combatant'

export default class Combatants extends Entities {
	_players = {}

	getEntities() {
		return this._players
	}

	getEntity(actorId) {
		let player = this._players[actorId]

		if (!player) {
			const info = this.parser.report.friendlies.find(player => player.id === actorId)
			if (!info) { return null }
			this._players[actorId] = player = new Combatant(this.parser, info)
		}

		return player
	}

	get selected() {
		// TODO: What if the player hasn't been checked yet?
		return this._players[this.parser.player.id]
	}
}
