import {Plural, Trans} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {Event} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import {AoeEvent} from 'parser/core/modules/AoE'
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'

// Assuming in correct forms
const AOTD_MIN_TARGETS = 3 // this is kinda also 4 but only under Leaden Fist
const ROCKBREAKER_MIN_TARGETS = 2

export default class MnkAoE extends Module {
	static handle = 'mnkaoe'

	@dependency private suggestions!: Suggestions

	private badAotDs: Event[] = []
	private badRocks: Event[] = []

	protected init(): void {
		this.addHook('aoedamage', {
			by: 'player',
			abilityId: ACTIONS.ARM_OF_THE_DESTROYER.id,
		}, this.onAotDDamage)

		this.addHook('aoedamage', {
			by: 'player',
			abilityId: ACTIONS.ROCKBREAKER.id,
		}, this.onRockbreakerDamage)

		this.addHook('complete', this.onComplete)
	}

	// TODO: figure out when player uses this for Silence effect, need to calculate interrupts on target
	private onAotDDamage(event: AoeEvent): void {
		if (event.hits.length < AOTD_MIN_TARGETS) {
			this.badAotDs.push(event)
		}
	}

	// TODO: if player is out of melee range and doing a single target RB, note it as minor
	private onRockbreakerDamage(event: AoeEvent): void {
		if (event.hits.length < ROCKBREAKER_MIN_TARGETS) {
			this.badRocks.push(event)
		}
	}

	private onComplete(): void {
		if (this.badAotDs.length >= 1) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.ARM_OF_THE_DESTROYER.icon,
				severity: SEVERITY.MEDIUM,
				content: <Trans id="mnk.aoe.suggestions.aotd.content">
					<ActionLink {...ACTIONS.ARM_OF_THE_DESTROYER}/> is only efficient when there are {AOTD_MIN_TARGETS} or more targets.
				</Trans>,
				why: <Trans id="mnk.aoe.suggestions.aotd.why">
					<ActionLink {...ACTIONS.ARM_OF_THE_DESTROYER}/> used on too few targets <Plural value={this.badAotDs.length} one="# time" other="# times" />.
				</Trans>,
			}))
		}

		if (this.badRocks.length >= 1) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.ROCKBREAKER.icon,
				severity: SEVERITY.MEDIUM,
				content: <Trans id="mnk.aoe.suggestions.rockbreaker.content">
					<ActionLink {...ACTIONS.ROCKBREAKER}/> is only efficient when there are {ROCKBREAKER_MIN_TARGETS} or more targets.
				</Trans>,
				why: <Trans id="mnk.aoe.suggestions.rockbreaker.why">
					<ActionLink {...ACTIONS.ROCKBREAKER}/> used on too few targets <Plural value={this.badRocks.length} one="# time" other="# times" />.
				</Trans>,
			}))
		}
	}
}
