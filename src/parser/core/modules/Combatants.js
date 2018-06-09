import Entities from './Entities'
import Combatant from '../Combatant'

export default class Combatants extends Entities {
	players = {}

	getEntities() {
		return this.players
	}

	getEntity(event) {
		if (!event.targetIsFriendly) {
			return null
		}

		const targetId = event.targetID
		let player = this.players[targetId]

		if (!player) {
			const info = this.parser.report.friendlies.find(player => player.id === targetId)
			if (!info) { return null }
			this.players[targetId] = player = new Combatant(this.parser, info)
		}

		return player
	}

	get selected() {
		// TODO: What if the player hasn't been checked yet?
		return this.players[this.parser.player.id]
	}
}
