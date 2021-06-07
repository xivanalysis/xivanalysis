import {Trans} from '@lingui/react'
import {StatusRoot} from 'data/STATUSES/root'
import {HealEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import React from 'react'

const HOT_STATUSES: Array<keyof StatusRoot> = [
	'ASPECTED_HELIOS',
	'WHEEL_OF_FORTUNE_DIURNAL',
	'WHEEL_OF_FORTUNE_NOCTURNAL',
	'ASPECTED_BENEFIC',
	'DIURNAL_OPPOSITION',
	'DIURNAL_INTERSECTION',
	'DIURNAL_BALANCE',
]

// doing 100-x where x is the overheal % for clarity
const SEVERITY_TIERS = {
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	[100-35]: TARGET.SUCCESS,
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	[100-50]: TARGET.WARN,
}

// Adapted from whm Overheal
export default class Overheal extends Module {
	static override handle = 'overheal'

	@dependency private data!: Data
	@dependency private checklist!: Checklist

	private healingDirect = 0
	private overhealDirect = 0
	private healingOverTime = 0
	private overhealOverTime = 0
	private healingPet = 0
	private overhealPet = 0

	private HOT_STATUSES: number[] = []

	protected override init() {
		HOT_STATUSES.forEach(actionKey => {
			this.HOT_STATUSES.push(this.data.statuses[actionKey].id)
		})

		this.addEventHook('heal', {by: 'player'}, this.onHeal)
		this.addEventHook('heal', {by: 'pet'}, this.onPetHeal)
		this.addEventHook('complete', this.onComplete)
	}

	private onHeal(event: HealEvent) {
		const guid = event.ability.guid
		if (this.HOT_STATUSES.includes(guid)) {
			this.healingOverTime += event.amount
			this.overhealOverTime += event.overheal || 0
		} else {
			this.healingDirect += event.amount
			this.overhealDirect += event.overheal || 0
		}
	}

	private onPetHeal(event: HealEvent) {
		this.healingPet += event.amount
		this.overhealPet += event.overheal || 0
	}

	private onComplete() {
		const nonHotOverhealPercent = 100 * this.healingDirect / (this.healingDirect + this.overhealDirect)
		const petOverhealPercent = 100 * this.healingPet / (this.healingPet + this.overhealPet)
		const hotOverhealPercent = 100 * this.healingOverTime / (this.healingOverTime + this.overhealOverTime)
		const sourcesSum = this.healingOverTime + this.healingDirect + this.healingPet
		const sourcesSumOverheal =  this.overhealOverTime + this.overhealPet + this.overhealDirect

		this.checklist.add(new TieredRule({
			name: <Trans id="ast.overheal.rule.name">Avoid overheal</Trans>,
			description: <><Trans id="ast.overheal.rule.description">
				Avoid wasting heals by healing for more than required to fill a target's HP bar. While some overheal is inevitable, overheal only serves to generate more enmity, for no gain. Being efficient with healing additionally helps with your MP management.
			</Trans>
			<ul>
				<li><Trans id="ast.overheal.requirement.nonhot"> Overheal (non-HoT): {this.invertPercent(nonHotOverhealPercent)}%</Trans></li>
				{petOverhealPercent > 0 && <li><Trans id="ast.overheal.requirement.earthly-star"> Overheal (Earthly Star): {this.invertPercent(petOverhealPercent)}%</Trans></li>}
				<li><Trans id="ast.overheal.requirement.hot"> Overheal (HoT): {this.invertPercent(hotOverhealPercent)}%</Trans></li>
			</ul></>,
			tiers: SEVERITY_TIERS,
			requirements: [
				new InvertedRequirement({
					name: <Trans id="ast.overheal.requirement.all"> Overheal (all sources)</Trans>,
					percent: (100 * sourcesSum / (sourcesSum + sourcesSumOverheal)), // put in inverted data
				}),
			],
		}))
	}
	private invertPercent(value: number) {
		const invertedValue = 100 - value
		return invertedValue.toFixed(2)
	}
}

// yeh, I'm not doing this in core, but I really want to show overheal as overheal, since that's what the community understands
export class InvertedRequirement extends Requirement {
	get percentInverted() {
		return 100 - this.percent
	}

	override get content() {
		if (this._percent !== null || this.value === null) { return `${this.percentInverted.toFixed(2)}%` }
		return `${this.value.toFixed(0)}/${this.target.toFixed(0)}` // avoid weird floating point shit
	}
}
