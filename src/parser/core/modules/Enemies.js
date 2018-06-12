import Entities from './Entities'
import Enemy from '../Enemy'

export default class Enemies extends Entities {
	_enemies = {}

	getEntities() {
		// Don't need to init this, getEntity will always be called prior with enough deets
		return this._enemies
	}

	getEntity(actorId) {
		let enemy = this._enemies[actorId]

		if (!enemy) {
			const info = this.parser.report.enemies.find(enemy => enemy.id === actorId)
			if (!info) { return null }
			this._enemies[actorId] = enemy = new Enemy(this.parser, info)
		}

		return enemy
	}
}
