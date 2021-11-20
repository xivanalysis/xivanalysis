import _ from 'lodash'
import Enemy from '../Enemy'
import Entities from './Entities'

const TARGET_CHECK_EVENT_TYPES = ['damage', 'heal']

export default class Enemies extends Entities {
	static handle = 'enemies'

	_enemies = {}

	// XIV seems to use a lot of copies of the boss to handle certain mechanics... which wouldn't be an issue if it wasn't for debuffs being mirrored to them to generate tonnes of crap.
	// Using normaliser to get instances that were _directly_ interacted with
	/** @type {Object.<string, Set.<number>>} */
	activeTargets = {}
	normalise(events) {
		const targets = {}
		for (let i = 0; i < events.length; i++) {
			const event = events[i]

			// Only care about events by the player, directly onto something else
			// Also only care when both data points are there
			if (
				!TARGET_CHECK_EVENT_TYPES.includes(event.type) ||
				event.sourceID !== this.parser.player.id ||
				!event.targetID
			) { continue }

			// Add the enemy to the list we care about
			const instances = targets[event.targetID] = targets[event.targetID] || new Set()
			if (event.targetInstance) {
				instances.add(event.targetInstance)
			}
		}

		this.activeTargets = targets

		return events
	}

	isActive(id, instance) {
		const instances = this.activeTargets[id]
		return instances ? (instances.size > 0? instances.has(instance) : true): false
	}

	getEntities() {
		// Don't need to init this, getEntity will always be called prior with enough deets
		return _.pickBy(this._enemies)
	}

	getEntity(actorId) {
		let enemy = this._enemies[actorId]

		if (enemy === undefined) {
			const info = this.parser.report.enemies.find(enemy => enemy.id === actorId)

			// Check that the info is actually a valid enemy - if it's not, save it as null so we don't re-process
			enemy = this.isValidEnemy(info)? new Enemy(this.parser, info) : null

			this._enemies[actorId] = enemy
		}

		return enemy
	}

	// Overrideable method for boss modules
	// If this returns false, the enemy will not be considered a valid target, and will automatically be excluded from checks in AoE and others.
	isValidEnemy(enemy) {
		if (enemy === undefined) {
			return false
		}

		return true
	}
}
