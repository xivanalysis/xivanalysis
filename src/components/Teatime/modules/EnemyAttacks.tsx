import {DamageEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import Timeline, {Item, ItemGroup} from 'parser/core/modules/Timeline'

// Enemy attacks

// LL Auto attack
// type: 'cast'
// ability.guid: 18808

// TODO: Do something with the per player damage events

export default class EnemyAttacks extends Module {
	static handle = 'enemyAttacks'

	@dependency private timeline!: Timeline

	private damageEvents: DamageEvent[] = []
	private targetDamageEvents: {[key: number]: DamageEvent[]} = {}

	protected init() {
		this.addHook('damage', {sourceIsFriendly: false}, this.onDamage)

		this.addHook('complete', this._onComplete)
	}

	private onDamage(event: DamageEvent) {
		this.damageEvents.push(event)
		if (!_.isNil(event.targetID)) {
			if (_.isNil(this.targetDamageEvents[event.targetID])) {
				this.targetDamageEvents[event.targetID] = []
			}
			this.targetDamageEvents[event.targetID].push(event)
		}
	}

	private _onComplete() {
		const startTime = this.parser.fight.start_time

		// TODO: This is TEA specific data
		const ABILITY_NAMES: {[key: number]: string} = {
			18808 : 'Auto Attack', // LL
			18809 : 'Auto Attack', // HAND
			19278 : 'Auto Attack', // Jagd Doll
		}

		for (const event of this.damageEvents) {
			const abilityName = event.ability.name || ABILITY_NAMES[event.ability.guid] || `${event.ability.guid}`
			this.timeline.addItem(new Item({
				type: 'point',
				group: event.targetID,
				// style: 'background-color: #ce909085;',
				start: event.timestamp - startTime,
				// end: event.timestamp - startTime,
				title: abilityName,
			}))
		}
	}
}
