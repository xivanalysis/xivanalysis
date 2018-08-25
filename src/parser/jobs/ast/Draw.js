import {i18nMark} from '@lingui/react'

import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {DRAWN_CARD_USE} from './ArcanaGroups'

export default class Draw extends Module {
	static handle = 'draw'
	static i18n_id = i18nMark('ast.draw.title')
	static dependencies = [
		'cooldowns',
	]

	constructor(...args) {
		super(...args)

		const filter = {
			by: 'player',
			abilityId: DRAWN_CARD_USE,
		}

		this.addHook('cast', filter, this._onDrawnCardUse)
	}

	_onDrawnCardUse() {
		this.cooldowns.startCooldown(ACTIONS.DRAW.id)
	}
}
