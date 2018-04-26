import Entities from './Entities'
import Enemy from '../Enemy'

export default class Enemies extends Entities {
	enemies = {}

	getEntities() {
		// Don't need to init this, getEntity will always be called prior with enough deets
		return this.enemies
	}

	getEntity(event) {
		if (event.targetIsFriendly) {
			return null
		}

		const targetId = event.targetID
		let enemy = this.enemies[targetId]

		if (!enemy) {
			const info = this.parser.report.enemies.find(enemy => enemy.id === targetId)
			if (!info) { return null }
			this.enemies[targetId] = enemy = new Enemy(this.parser, info)
		}

		return enemy
	}
}
