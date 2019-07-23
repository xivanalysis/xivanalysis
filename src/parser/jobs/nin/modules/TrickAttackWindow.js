import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

export default class TrickAttackWindow extends Module {
	static handle = 'taWindow'
	static dependencies = [
		'enemies',
		'suggestions',
	]

	_dwadOutsideTa = 0
	_assassinateOutsideTa = 0
	_armorCrushInTa = 0

	_dwadCast = false

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.DREAM_WITHIN_A_DREAM.id}, () => this._dwadCast = true)
		this.addHook('combo', {by: 'player', abilityId: ACTIONS.ARMOR_CRUSH.id}, this._onArmorCrush)
		this.addHook('damage', {by: 'player', abilityId: ACTIONS.DREAM_WITHIN_A_DREAM.id}, this._onDwadHit)
		this.addHook('damage', {by: 'player', abilityId: ACTIONS.ASSASSINATE.id}, this._onAssassinate)
		this.addHook('complete', this._onComplete)
	}

	_targetHasVuln(targetId) {
		const target = this.enemies.getEntity(targetId)
		return target && target.hasStatus(STATUSES.TRICK_ATTACK_VULNERABILITY_UP.id)
	}

	_onArmorCrush(event) {
		if (this._targetHasVuln(event.targetID)) {
			this._armorCrushInTa++
		}
	}

	_onDwadHit(event) {
		if (this._dwadCast) {
			// Reset the flag so we only check the first hit
			this._dwadCast = false
			if (!this._targetHasVuln(event.targetID)) {
				this._dwadOutsideTa++
			}
		}
	}

	_onAssassinate(event) {
		if (!this._targetHasVuln(event.targetID)) {
			this._assassinateOutsideTa++
		}
	}

	_onComplete() {
		if (this._dwadOutsideTa > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DREAM_WITHIN_A_DREAM.icon,
				content: <Trans id="nin.ta-window.suggestions.dream.content">
					Avoid using <ActionLink {...ACTIONS.DREAM_WITHIN_A_DREAM}/> outside of Trick Attack windows. Since they're both on 60 second cooldowns, they should always be paired to maximize DPS.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="nin.ta-window.suggestions.dream.why">
					You used Dream Within A Dream <Plural value={this._dwadOutsideTa} one="# time" other="# times"/> outside of Trick Attack.
				</Trans>,
			}))
		}

		if (this._assassinateOutsideTa > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.ASSASSINATE.icon,
				content: <Trans id="nin.ta-window.suggestions.assassinate.content">
					Try to fit your <ActionLink {...ACTIONS.ASSASSINATE}/> casts inside your Trick Attack windows. Since it chains off of <ActionLink {...ACTIONS.DREAM_WITHIN_A_DREAM}/>, you should be able to use them both in every window.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="nin.ta-window.suggestions.assassinate.why">
					You used Assassinate <Plural value={this._assassinateOutsideTa} one="# time" other="# times"/> outside of Trick Attack.
				</Trans>,
			}))
		}

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.ARMOR_CRUSH.icon,
			content: <Trans id="nin.ta-window.suggestions.armor-crush.content">
				Avoid using <ActionLink {...ACTIONS.ARMOR_CRUSH}/> during Trick Attack windows. Unless Huton would otherwise fall off, <ActionLink {...ACTIONS.AEOLIAN_EDGE}/> or <ActionLink {...ACTIONS.SHADOW_FANG}/> are always preferable for the additional damage.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
			},
			value: this._armorCrushInTa,
			why: <Trans id="nin.ta-window.suggestions.armor-crush.why">
				You used Armor Crush <Plural value={this._armorCrushInTa} one="# time" other="# times"/> during Trick Attack.
			</Trans>,
		}))
	}
}
