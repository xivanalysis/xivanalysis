import React, {Fragment} from 'react'
//import {Icon, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const TA_DURATION_MILLIS = 10000

export default class TrickAttackWindow extends Module {
	static handle = 'taWindow'
	static dependencies = [
		'suggestions',
	]

	_taTimestamp = -10000
	_dwadOutsideTa = 0
	_armorCrushInTa = 0

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityId = event.ability.guid

		if (abilityId === ACTIONS.TRICK_ATTACK.id) {
			this._taTimestamp = event.timestamp
		} else if (abilityId === ACTIONS.DREAM_WITHIN_A_DREAM.id) {
			if (event.timestamp - this._taTimestamp > TA_DURATION_MILLIS) {
				this._dwadOutsideTa++
			}
		} else if (abilityId === ACTIONS.ARMOR_CRUSH.id) {
			if (event.timestamp - this._taTimestamp <= TA_DURATION_MILLIS) {
				this._armorCrushInTa++
			}
		}
	}

	_onComplete() {
		if (this._dwadOutsideTa > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DREAM_WITHIN_A_DREAM.icon,
				content: <Fragment>
					Avoid using <ActionLink {...ACTIONS.DREAM_WITHIN_A_DREAM}/> outside of Trick Attack windows. Since they&apos;re both on 60 second cooldowns, they should always be paired to maximize DPS.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					You used Dream Within A Dream {this._dwadOutsideTa} time{this._dwadOutsideTa !== 1 && 's'} outside of Trick Attack.
				</Fragment>,
			}))
		}

		if (this._armorCrushInTa > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.ARMOR_CRUSH.icon,
				content: <Fragment>
					Avoid using <ActionLink {...ACTIONS.ARMOR_CRUSH}/> during Trick Attack windows. Unless Huton would otherwise fall off, <ActionLink {...ACTIONS.AEOLIAN_EDGE}/> or <ActionLink {...ACTIONS.SHADOW_FANG}/> are always preferable for the additional damage.
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					You used Armor Crush {this._armorCrushInTa} time{this._armorCrushInTa !== 1 && 's'} during Trick Attack.
				</Fragment>,
			}))
		}
	}
}
