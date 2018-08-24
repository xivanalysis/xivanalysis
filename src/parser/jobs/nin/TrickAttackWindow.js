import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

export default class TrickAttackWindow extends Module {
	static handle = 'taWindow'
	static dependencies = [
		'enemies',
		'suggestions',
	]

	_dwadOutsideTa = 0
	_armorCrushInTa = 0

	_dwadCast = false

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player', abilityId: [ACTIONS.DREAM_WITHIN_A_DREAM.id, ACTIONS.ARMOR_CRUSH.id]}, this._onCast)
		this.addHook('damage', {by: 'player', abilityId: ACTIONS.DREAM_WITHIN_A_DREAM.id}, this._onDwadHit)
		this.addHook('complete', this._onComplete)
	}

	_targetHasVuln(targetId) {
		const target = this.enemies.getEntity(targetId)
		return target && target.hasStatus(STATUSES.TRICK_ATTACK_VULNERABILITY_UP.id)
	}

	_onCast(event) {
		const abilityId = event.ability.guid

		if (abilityId === ACTIONS.DREAM_WITHIN_A_DREAM.id) {
			this._dwadCast = true // DWaD casts don't have a target, so just flag it and check the target in the damage event
		} else if (abilityId === ACTIONS.ARMOR_CRUSH.id && this._targetHasVuln(event.targetID)) {
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

	_onComplete() {
		if (this._dwadOutsideTa > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DREAM_WITHIN_A_DREAM.icon,
				content: <Trans id="nin.ta-window.suggestions.dream.content">
					Avoid using <ActionLink {...ACTIONS.DREAM_WITHIN_A_DREAM}/> outside of Trick Attack windows. Since they're both on 60 second cooldowns, they should always be paired to maximize DPS.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Plural id="nin.ta-window.suggestions.dream.why"
					value={this._dwadOutsideTa}
					one="You used Dream Within A Dream # time outside of Trick Attack."
					other="You used Dream Within A Dream # times outside of Trick Attack."/>,
			}))
		}

		if (this._armorCrushInTa > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.ARMOR_CRUSH.icon,
				content: <Trans id="nin.ta-window.suggestions.armor-crush.content">
					Avoid using <ActionLink {...ACTIONS.ARMOR_CRUSH}/> during Trick Attack windows. Unless Huton would otherwise fall off, <ActionLink {...ACTIONS.AEOLIAN_EDGE}/> or <ActionLink {...ACTIONS.SHADOW_FANG}/> are always preferable for the additional damage.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Plural id="nin.ta-window.suggestions.armor-crush.why"
					value={this._armorCrushInTa}
					one="You used Armor Crush # time during Trick Attack."
					other="You used Armor Crush # times during Trick Attack."/>,
			}))
		}
	}
}
