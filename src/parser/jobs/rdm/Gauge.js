import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const MANA_GAIN = {
    [ACTIONS.VERSTONE.id]: {white: 9},
    [ACTIONS.JOLT_II.id]: {white: 3, black: 3},
}

export default class Gauge extends Module {
    whiteMana = 0
    blackMana = 0

    constructor(...args) {
        super(...args)

        this.addHook('cast', {by: 'player'}, this._onCast)
    }

    _onCast(event) {
        const manaGain = MANA_GAIN[event.ability.guid]
        if (!manaGain) { return }
        this.whiteMana += manaGain.white||0
        this.blackMana += manaGain.black||0
        // TODO: Handle halved due to imbalance etc
        // Imbalance is > 30 difference, causes a 50% loss on losing side with floor rounding
    }
}