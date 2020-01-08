import stable from 'stable'

import {ActorType} from 'fflogs'
import Module from 'parser/core/Module'

const ACTOR_TYPE_ORDER = {
	[ActorType.PALADIN]: 0,
	[ActorType.WARRIOR]: 1,
	[ActorType.DARK_KNIGHT]: 2,
	[ActorType.GUNBREAKER]: 3,
	[ActorType.WHITE_MAGE]: 4,
	[ActorType.SCHOLAR]: 5,
	[ActorType.ASTROLOGIAN]: 6,
	[ActorType.MONK]: 7,
	[ActorType.DRAGOON]: 8,
	[ActorType.NINJA]: 9,
	[ActorType.SAMURAI]: 10,
	[ActorType.BARD]: 11,
	[ActorType.MACHINIST]: 12,
	[ActorType.DANCER]: 13,
	[ActorType.BLACK_MAGE]: 14,
	[ActorType.SUMMONER]: 15,
	[ActorType.RED_MAGE]: 16,
}

export default class Friendlies extends Module {
	static handle = 'friendlies'
	static dependencies = []

	_playerFriendlies = []

	constructor(...args) {

		super(...args)

		const reportFriendlies = this.parser.report.friendlies
		const fight_id = this.parser.fight.id
		this._playerFriendlies = this._filterPlayers(reportFriendlies, fight_id)
		stable.inplace(this._playerFriendlies, (a, b) => {
			if (a.type === b.type) {
				return a.id - b.id
			}
			return ACTOR_TYPE_ORDER[a.type] - ACTOR_TYPE_ORDER[b.type]
		})

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
