import {Trans} from '@lingui/react'
import React from 'react'

import {HealEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'

// doing 100-x where x is the overheal % for clarity
const SEVERITY_TIERS = {
	// tslint:disable-next-line: no-magic-numbers
	[100-35]: TARGET.SUCCESS,
	// tslint:disable-next-line: no-magic-numbers
	[100-50]: TARGET.WARN,
}

export class CoreOverheal extends Module {
	static handle: string = 'overheal'
	static debug: boolean = true

	@dependency private checklist!: Checklist

	/**
	 * Implementing modules MAY override this to provide HoT Status IDs to track against
	 */
	protected hotStatuses?: number[]
	/**
	 * Implementing modules MAY override this to separate out pet heals from the player. If
	 * omitted, then pet heals will be combined with the player.
	 */
	protected petHeals?: number[]
	/**
	 * Implementing modules MAY override this to provide HoT Status IDs to track against for the pet;
	 * if this is omitted, pet HoTs will count for the player HoT overheal.
	 */
	protected petHotStatuses?: number[]

	// direct healing
	private healDirect: number = 0
	private overhealDirect: number = 0
	// HoTs
	private healOverTime: number = 0
	private overhealOverTime: number = 0
	// pet - direct healing
	private petHealDirect: number = 0
	private petOverhealDirect: number = 0
	// pet - HoTs
	private petHealOverTime: number = 0
	private petOverhealOverTime: number = 0

	protected init() {
		this.addEventHook('heal', {by: 'player'}, this.onHeal)
		this.addEventHook('heal', {by: 'pet'}, this.onPetHeal)
		this.addEventHook('complete', this.onComplete)
	}

	/**
	 * This method MAY be overridden to return true or false, indicating if a heal
	 * should be counted. If true is returned, the heal is counted towards overheal;
	 * false ignores the heal entirely.
	 * @param event
	 */
	protected considerHeal(event: HealEvent, pet: boolean = false): boolean {
		return true
	}

	private onHeal(event: HealEvent) {
		if (! this.considerHeal(event)) return

		const guid = event.ability.guid
		if (this.hotStatuses && this.hotStatuses.includes(guid)) {
			this.healOverTime += event.amount
			this.overhealOverTime += event.overheal || 0
		} else {
			this.healDirect += event.amount
			this.overhealDirect += event.amount
		}

	}

	private onPetHeal(event: HealEvent) {
		if (! this.considerHeal(event, true)) return

		const guid = event.ability.guid
		if (this.petHotStatuses && this.petHotStatuses.includes(guid)) {
			this.petHealOverTime += event.amount
			this.petOverhealOverTime += event.overheal || 0
		}
	}

	protected calculateOverhealPercent(heal: number, overheal: number) {
		return 100 * heal / (heal + overheal)
	}

	private onComplete() {
		const overhealPercent = this.calculateOverhealPercent(this.healDirect, this.overhealDirect)
		const overhealOverTimePercent = this.calculateOverhealPercent(this.healOverTime, this.overhealOverTime)
		const petOverhealPercent = this.calculateOverhealPercent(this.petHealDirect, this.petOverhealDirect)
		const petOverhealOverTimePercent = this.calculateOverhealPercent(this.petHealOverTime, this.petOverhealOverTime)
		const overallOverhealPercent = this.calculateOverhealPercent(
			this.healDirect + this.healOverTime + this.petHealDirect + this.petHealOverTime,
			this.overhealDirect + this.overhealOverTime + this.petOverhealDirect + this.petOverhealOverTime,
		)

		this.checklist.add(new TieredRule({
			name: <Trans id="core.overheal.rule.name">Avoid overheal</Trans>,
			description: <>If u overheal too much u bad</>,
			tiers: SEVERITY_TIERS,
			requirements: [
				new InvertedRequirement({
					name: <Trans id="core.overheal.requirement.all">Overheal (direct)</Trans>,
					percent: (overhealPercent),
				}),
				new InvertedRequirement({
					name: <Trans id="core.overheal.requirement.all">Overheal (HoTs)</Trans>,
					percent: (overhealOverTimePercent),
				}),
				new InvertedRequirement({
					name: <Trans id="core.overheal.requirement.all">Overheal (Pet)</Trans>,
					percent: (petOverhealPercent),
				}),
				new InvertedRequirement({
					name: <Trans id="core.overheal.requirement.all">Overheal (Pet HoTs)</Trans>,
					percent: (petOverhealOverTimePercent),
				}),
			],
		}))
	}
}

// Explicitly not exporting this because there isn't a need for this sort of
// utility outside of overhealing
class InvertedRequirement extends Requirement {
	get percentInverted() {
		return 100 - this.percent
	}

	get content() {
		if (this._percent !== null || this.value === null) {
			return `${this.percentInverted.toFixed(2)}`
		}
		return `${this.value.toFixed(0)}/${this.target.toFixed(0)}`
	}
}
