import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredRule, TARGET, Requirement} from 'parser/core/modules/Checklist'

export default class Overheal extends Module {
	static handle = 'overheal'
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
		this.checklist.add(new TieredRule({
			name: 'Avoid overheal',
			description: 'Avoid wasting heals by healing for more than required to fill a target\'s HP bar. While some overheal is inevitable, overheal only serves to generate more enmity, for no gain. Being efficient with healing additionally helps with your MP management.',
			tiers: {[100-35]: TARGET.SUCCESS, [100-50]: TARGET.WARN},
			requirements: [
				new InvertedRequirement({
					name: 'Overheal (non-HoT)',
					percent: 100 * this._healingDirect / (this._healingDirect + this._overhealDirect), //put in inverted data
				}),
				new InvertedRequirement({
					name: 'Overheal (HoT)',
					percent: 100 * this._healingOverTime / (this._healingOverTime + this._overhealOverTime), //put in inverted data
				}),
				new InvertedRequirement({
					name: 'Overheal (all sources)',
					percent: 100 * (this._healingOverTime + this._healingDirect) / (this._healingDirect + this._overhealDirect + this._healingOverTime + this._overhealOverTime), //put in inverted data
				}),
			],
		}))
	}
}

//yeh, I'm not doing this in core, but I really want to show overheal as overheal, since that's what the community understands
export class InvertedRequirement extends Requirement {
	constructor(options) {
		super(options)

	}
	get percentInverted() {
		return 100 - this.percent
	}

	get content() {
		if (this._percent !== null || this.value === null) { return `${this.percentInverted.toFixed(2)}%` }
		return `${this.value.toFixed(0)}/${this.target.toFixed(0)}` //avoid weird floating point shit
	}
}
