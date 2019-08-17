import {t} from '@lingui/macro'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import React from 'react'

const REQUIRED_MULTI_HIT_TARGETS = {
	[ACTIONS.PAINFLARE.id]: 2,
	[ACTIONS.ENERGY_SIPHON.id]: 3,
	[ACTIONS.OUTBURST.id]: 3,
}

const SEVERITY_LOW_TARGET_ATTACKS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	4: SEVERITY.MAJOR,
}

export default class MultiHit extends Module {
	static handle = 'multihit'
	static title = t('smn.multihit.title')`Multi-Hit`
	static dependencies = [
		'suggestions',
	]

	_incorrectMultihitSkills = { }

	constructor(...args) {
		super(...args)
		this.addHook('aoedamage', {by: 'player', abilityId: Object.keys(REQUIRED_MULTI_HIT_TARGETS).map(Number)}, this._checkMultiHitSkill)
		this.addHook('complete', this._onComplete)
	}

	_checkMultiHitSkill(event) {
		if (REQUIRED_MULTI_HIT_TARGETS.hasOwnProperty(event.ability.guid) && event.hits.length < REQUIRED_MULTI_HIT_TARGETS[event.ability.guid]) {
			this._incorrectMultihitSkills[event.ability.guid] = (this._incorrectMultihitSkills[event.ability.guid] || 0) + 1
		}
	}

	_onComplete() {
		const  lowTargetAttacks = Object.values(this._incorrectMultihitSkills).reduce((acc, cur) => acc + cur, 0)

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.OUTBURST.icon,
			content: <Trans id="smn.multihit.suggestions.content">
				Do not use <ActionLink {...ACTIONS.PAINFLARE}/> on a single target, or <ActionLink {...ACTIONS.ENERGY_SIPHON}/> or <ActionLink {...ACTIONS.OUTBURST}/> on less than 3 targets.
				Instead use <ActionLink {...ACTIONS.FESTER}/>, <ActionLink {...ACTIONS.ENERGY_DRAIN}/>, or <ActionLink {...ACTIONS.RUIN_III}/> respectively, as they will deal more total damage.
			</Trans>,
			tiers: SEVERITY_LOW_TARGET_ATTACKS,
			value: lowTargetAttacks,
			why: <Trans id="smn.multihit.suggestions.why">
				{lowTargetAttacks} <Plural value={lowTargetAttacks} one="multi-target attack was" other="multi-target attacks were"/> used against too few targets.
			</Trans>,
		}))
	}
}
