import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import React from 'react'

const REQUIRED_MULTI_HIT_TARGETS = {
	[ACTIONS.FLOOD_OF_SHADOW.id]: 2,
	[ACTIONS.UNLEASH.id]: 2,
	[ACTIONS.STALWART_SOUL.id]: 2,
	[ACTIONS.QUIETUS.id]: 3,
}

const SEVERITY_LOW_TARGET_ATTACKS = {
	1: SEVERITY.LOW,
	2: SEVERITY.MEDIUM,
	4: SEVERITY.MAJOR,
}

export default class MultiHit extends Module {
	static handle = 'multihit'
	static dependencies = [
		'suggestions',
	]

	_incorrectMultihitSkills = {
		[ACTIONS.FLOOD_OF_SHADOW.id]: 0,
		[ACTIONS.QUIETUS.id]: 0,
		[ACTIONS.UNLEASH.id]: 0,
		[ACTIONS.STALWART_SOUL.id]: 0,
	}

	constructor(...args) {
		super(...args)
		this.addHook('aoedamage', {by: 'player', abilityId: Object.keys(this._incorrectMultihitSkills).map(Number)}, this._checkMultiHitSkill)
		this.addHook('complete', this._onComplete)
	}

	_checkMultiHitSkill(event) {
		if (REQUIRED_MULTI_HIT_TARGETS.hasOwnProperty(event.ability.guid) && event.hits.length < REQUIRED_MULTI_HIT_TARGETS[event.ability.guid]) {
			this._incorrectMultihitSkills[event.ability.guid]++
		}
	}

	_onComplete() {
		let lowTargetAttacks = 0
		for (const prop in this._incorrectMultihitSkills) {
			lowTargetAttacks += this._incorrectMultihitSkills[prop]
		}
		if (lowTargetAttacks > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.QUIETUS.icon,
				content: <Trans id="drk.multihit.suggestions.content">
					Do not use multi-hit GCDs or <ActionLink {...ACTIONS.FLOOD_OF_SHADOW}/> unless they can hit at least 2 targets, or <ActionLink {...ACTIONS.QUIETUS}/> unless it can hit at least 3 targets.
					Multi-hit GCDs are lower total damage than single target GCDs against only 1 target, and <ActionLink {...ACTIONS.FLOOD_OF_SHADOW}/> or <ActionLink {...ACTIONS.QUIETUS}/> consume resources that can be used on more powerful single target attacks.
				</Trans>,
				tiers: SEVERITY_LOW_TARGET_ATTACKS,
				value: lowTargetAttacks,
				why: <Trans id="drk.multihit.suggestions.why">
					{lowTargetAttacks} <Plural value={lowTargetAttacks} one="multi-target attack was" other="multi-target attacks were"/> used against too few targets.
				</Trans>,
			}))
		}
	}
}
