import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredRule, TARGET, Requirement} from 'parser/core/modules/Checklist'
import {Trans} from '@lingui/react'
import React from 'react'

const SUCCESS_TARGET = 35
const WARN_TARGET = 50

export default class Overheal extends Module {
	static handle = 'overheal'
	static dependencies = [
		'checklist',
	]

	constructor(...args) {
		super(...args)

		this.addEventHook('heal', {by: 'player'}, this._onHeal)
		this.addEventHook('complete', this._onComplete)
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
		this.checklist.add(new TieredRule({
			name: <Trans id="whm.overheal.rule.name">Avoid overheal</Trans>,
			description: <Trans id="whm.overheal.rule.description"> Avoid wasting heals by healing for more than required to fill a target's HP bar. While some overheal is inevitable, overheal only serves to generate more enmity, for no gain. Being efficient with healing additionally helps with your MP management. </Trans>,
			tiers: {[100-SUCCESS_TARGET]: TARGET.SUCCESS, [100-WARN_TARGET]: TARGET.WARN}, //doing 100-x where x is the overheal % for clarity
			requirements: [
				new InvertedRequirement({
					name: <Trans id="whm.overheal.requirement.nonhot"> Overheal (non-HoT) </Trans>,
					percent: 100 * this._healingDirect / (this._healingDirect + this._overhealDirect), //put in inverted data
				}),
				new InvertedRequirement({
					name: <Trans id="whm.overheal.requirement.hot"> Overheal (HoT) </Trans>,
					percent: 100 * this._healingOverTime / (this._healingOverTime + this._overhealOverTime), //put in inverted data
				}),
				new InvertedRequirement({
					name: <Trans id="whm.overheal.requirement.all"> Overheal (all sources)</Trans>,
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
