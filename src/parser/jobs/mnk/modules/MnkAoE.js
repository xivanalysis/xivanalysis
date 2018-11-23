import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'

import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const ROCKBREAKER_MIN_TARGETS = 2
const AOTD_MIN_TARGETS = 5

export default class MnkAoE extends Module {
	static handle = 'mnkaoe'
	static dependencies = [
		'suggestions',
	]

	_badAotDs = []
	_badRocks = []

	constructor(...args) {
		super(...args)

		this.addHook('aoedamage', {
			by: 'player',
			abilityId: ACTIONS.ARM_OF_THE_DESTROYER.id,
		}, this._onAotDDamage)

		this.addHook('aoedamage', {
			by: 'player',
			abilityId: ACTIONS.ROCKBREAKER.id,
		}, this._onRockbreakerDamage)

		this.addHook('complete', this._onComplete)
	}

	// TODO: figure out when player uses this for Silence effect, need to calculate interrupts on target
	_onAotDDamage(event) {
		if (event.hits.length < AOTD_MIN_TARGETS) {
			this._badAotDs.push(event)
		}
	}

	// TODO: if player is out of melee range and doing a single target RB, note it as minor
	_onRockbreakerDamage(event) {
		if (event.hits.length < ROCKBREAKER_MIN_TARGETS) {
			this._badRocks.push(event)
		}
	}

	_onComplete() {
		if (this._badAotDs.length >= 1) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.ARM_OF_THE_DESTROYER.icon,
				severity: SEVERITY.MEDIUM,
				content: <>
					<Trans id="mnk.aoe.suggestions.aotd.content"><ActionLink {...ACTIONS.ARM_OF_THE_DESTROYER}/> is only efficient when there are {AOTD_MIN_TARGETS} or more targets.</Trans>
				</>,
				why: <>
					<Trans id="mnk.aoe.suggestions.aotd.why">
						<ActionLink {...ACTIONS.ARM_OF_THE_DESTROYER}/> used on too few targets <Plural value={this._badAotDs.length} one="# time" other="# times" />.
					</Trans>
				</>,
			}))
		}

		if (this._badRocks.length >= 1) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.ROCKBREAKER.icon,
				severity: SEVERITY.MEDIUM,
				content: <>
					<Trans id="mnk.aoe.suggestions.rockbreaker.content"><ActionLink {...ACTIONS.ROCKBREAKER}/> is only efficient when there are {ROCKBREAKER_MIN_TARGETS} or more targets.</Trans>
				</>,
				why: <>
					<Trans id="mnk.aoe.suggestions.rockbreaker.why">
						<ActionLink {...ACTIONS.ROCKBREAKER}/> used on too few targets <Plural value={this._badRocks.length} one="# time" other="# times" />.
					</Trans>
				</>,
			}))
		}
	}
}
