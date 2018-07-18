import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import Suggestions, { Suggestion, SEVERITY } from 'parser/core/modules/Suggestions'

const MANA_GAIN = {
    [ACTIONS.VERSTONE.id]: {white: 9},
    [ACTIONS.VERFIRE.id]: {black: 9},
    [ACTIONS.VERAREO.id]: {white: 11},
    [ACTIONS.VERTHUNDER.id]: {black: 11},
    [ACTIONS.VERHOLY.id]: {white: 21},
    [ACTIONS.VERFLARE.id]: {black: 21},
    [ACTIONS.JOLT.id]: {white: 3, black: 3},
    [ACTIONS.JOLT_II.id]: {white: 3, black: 3},
    [ACTIONS.IMPACT.id]: {white: 4, black: 4},
    [ACTIONS.SCATTER.id]: {white: 3, black: 3},
}

export default class Gauge extends Module {
    static handle = 'gauge'
    static dependencies = [
        'combatants',
        'cooldowns',
        'suggestions',
    ]
    _whiteMana = 0
    _blackMana = 0
    _whiteManaWasted = 0
    _blackManaWasted = 0

    constructor(...args) {
        super(...args)

        this.addHook('cast', {by: 'player'}, this._onCast)
        this.addHook('complete', this._onComplete)
    }

    _onCast(event) {
        const abilityId = event.ability.guid
        var isCalculated = false

        if (abilityId === ACTIONS.MANAFICATION.id) {
            this._whiteMana = this._whiteMana * 2
            this._blackMana = this._blackMana * 2

            this.cooldowns.resetCooldown(ACTIONS.CORPS_A_CORPS.id)
            this.cooldowns.resetCooldown(ACTIONS.DISPLACEMENT.id)
            isCalculated = true
        }

        const manaGain = MANA_GAIN[abilityId]
        if (manaGain)
        {
            isCalculated = true
        }

        if (abilityId === ACTIONS.SCATTER.id && isCalculated)
        {
            //Check the Buffs on the player for Enhanced scatter
            if (this.combatants.selected.hasStatus(STATUSES.ENHANCED_SCATTER.id))
            {
                manaGain.white = 8
                manaGain.black = 8
            }
        }

        if (isCalculated && manaGain.white && this._blackMana - this._whiteMana > 30)
        {
            manaGain.white = Math.floor(manaGain.white/2)
        }

        if (isCalculated && manaGain.black && this._whiteMana - this._blackMana > 30)
        {
            manaGain.black = Math.floor(manaGain.black/2)
        }

        if (isCalculated)
        {
            this._whiteMana += manaGain.white||0
            this._blackMana += manaGain.black||0
        }

        if (isCalculated && this._whiteMana > 100)
        {
            this._whiteManaWasted += this._whiteMana - 100
            this._whiteMana = 100
        }

        if (isCalculated && this._blackMana > 100)
        {
            this._blackManaWasted += this._blackMana - 100
            this._blackMana = 100
        }

        return
    }

    _onComplete() {
        console.log('Is Complete')
        if (this._whiteManaWasted && this._whiteManaWasted > 0)
        {
            this.suggestions.add(new Suggestion({
                icon: ACTIONS.VERHOLY.icon,
                content: <Fragment>
                    Ensure you don't overcap your White Mana before a combo, you lost {this._whiteManaWasted} White Mana
                </Fragment>,
                severity: SEVERITY.MEDIUM,
                why: <Fragment>
                    Overcapping White Mana indicates your balance was off, and you lost out on Enchanted Combo damage.  You should look to execute at 80/80 or as close to it as possible.
                </Fragment>,
            }))
        }

        if (this._blackManaWasted && this._blackManaWasted > 0)
        {
            this.suggestions.add(new Suggestion({
                icon: ACTIONS.VERFLARE.icon,
                content: <Fragment>
                    Ensure you don't overcap your Black Mana before a combo, you lost {this._blackManaWasted} Black Mana
                </Fragment>,
                severity: SEVERITY.MEDIUM,
                why: <Fragment>
                    Overcapping Black Mana indicates your balance was off, and you lost out on Enchanted Combo damage.  You should look to execute at 80/80 or as close to it as possible.
                </Fragment>,
            }))
        }
    }
}