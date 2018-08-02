import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'

export default class EffectiveHealing extends Module {
	static handle = 'effectivehealing'
	static dependencies = [
		'checklist',
	]

	constructor(...args) {
		super(...args)

		this.addHook('heal', {by: 'player'}, this._onHeal)
		this.addHook('complete', this._onComplete)
	}

	healOverTimeStatuses = [STATUSES.REGEN.id, STATUSES.MEDICA_II.id]

	_healingDirect = 0
	_overhealDirect = 0
	_healingOverTime = 0
	_overhealOverTime = 0

	_onHeal(event) {
		const guid = event.ability.guid
		if (this.healOverTimeStatuses.includes(guid)) {
			this._healingOverTime += event.amount
			this._overhealOverTime += event.overheal || 0
		} else {
			this._healingDirect += event.amount
			this._overhealDirect += event.overheal || 0
		}
	}

	_onComplete() {
		console.log(this.healOverTimeStatuses)
		this.checklist.add(new Rule({
			name: 'Minimize overheal / Heal effectively',
			description: 'Heal effectively, avoid wasting heals by healing for more than their HP bar (also called overhealing). Doing this allows you to conserve MP better and find more spots to deal damage.',
			requirements: [
				new Requirement({
					name: 'Effective healing through direct heals',
					percent: 100 * this._healingDirect / (this._healingDirect + this._overhealDirect),
					weight: 100,
				}),
				new Requirement({
					name: 'Effective healing through HoTs',
					percent: 100 * this._healingOverTime / (this._healingOverTime + this._overhealOverTime),
					weight: 50,
				}),
				new Requirement({
					name: 'Effective healing (all sources)',
					percent: 100 * (this._healingOverTime + this._healingDirect) / (this._healingDirect + this._overhealDirect + this._healingOverTime + this._overhealOverTime),
				}),
			],
		}))
	}
}
