import {ActorType} from 'fflogs'
import Module from 'parser/core/Module'

export default class Friendlies extends Module {
	static handle = 'friendlies'
	static dependencies = [
		// 'data',
	]

	_playerFriendlies = []

	constructor(...args) {

		super(...args)

		const reportFriendlies = this.parser.report.friendlies
		const fight_id = this.parser.fight.id
		this._playerFriendlies = this._filterPlayers(reportFriendlies, fight_id)
	}

	_filterPlayers(friendlies, currentFight) {
		if (!friendlies.length) {
			return []
		}
		return friendlies.filter((friendly) => {
			const inFight = friendly.fights.some(fight => fight.id === currentFight)
			const type = friendly.type
			return !(
				type === ActorType.LIMIT_BREAK ||
				type === ActorType.NPC ||
				!inFight
			)
		})
	}

	get playerFriendlies() {
		return this._playerFriendlies
	}
}
