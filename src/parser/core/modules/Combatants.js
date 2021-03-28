import Combatant from '../Combatant'
import Entities from './Entities'

export default class Combatants extends Entities {
	static handle = 'combatants'

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
		return this.getEntity(this.parser.player.id)
	}
}
